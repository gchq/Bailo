import { Validator } from 'jsonschema'
import { ClientSession, PipelineStage, Types } from 'mongoose'

import { Roles } from '../connectors/authentication/constants.js'
import authentication from '../connectors/authentication/index.js'
import { AccessRequestAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import AccessRequestModel, { AccessRequestDoc, AccessRequestInterface } from '../models/AccessRequest.js'
import { ModelDoc } from '../models/Model.js'
import ResponseModel, { ResponseKind } from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import { WebhookEvent } from '../models/Webhook.js'
import { AccessRequestUserPermissions } from '../types/types.js'
import { isValidatorResultError } from '../types/ValidatorResultError.js'
import { toEntity } from '../utils/entity.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { authResponseToUserPermission } from '../utils/permissions.js'
import log from './log.js'
import { getModelById } from './model.js'
import { removeResponsesByParentIds } from './response.js'
import { createAccessRequestReviews, removeAccessRequestReviews } from './review.js'
import { getSchemaById } from './schema.js'
import { sendWebhooks } from './webhook.js'

export type CreateAccessRequestParams = Pick<AccessRequestInterface, 'metadata' | 'schemaId'>
export async function createAccessRequest(
  user: UserInterface,
  modelId: string,
  accessRequestInfo: CreateAccessRequestParams,
) {
  // Check the model exists and the user can view it before creating an access request
  const model = await getModelById(user, modelId)

  // Ensure that the AR meets the schema
  const schema = await getSchemaById(accessRequestInfo.schemaId)
  if (schema.hidden) {
    throw BadReq('Cannot create new Access Request using a hidden schema.', { schemaId: accessRequestInfo.schemaId })
  }
  try {
    new Validator().validate(accessRequestInfo.metadata, schema.jsonSchema, { throwAll: true, required: true })
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Access Request Metadata could not be validated against the schema.', {
        schemaId: accessRequestInfo.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  const accessRequestId = convertStringToId(accessRequestInfo.metadata.overview.name)
  const accessRequest = new AccessRequestModel({
    id: accessRequestId,
    createdBy: user.dn,
    modelId,
    comments: [],
    ...accessRequestInfo,
  })

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  await accessRequest.save()

  try {
    await createAccessRequestReviews(model, accessRequest)
  } catch (error) {
    // Transactions here would solve this issue.
    log.warn(error, 'Error when creating Release Review Requests. Approval cannot be given to this Access Request')
  }

  sendWebhooks(
    accessRequest.modelId,
    WebhookEvent.CreateAccessRequest,
    `Access Request ${accessRequest.id} has been created for model ${accessRequest.modelId}`,
    { accessRequest },
  )

  return accessRequest
}

export async function removeAccessRequests(
  user: UserInterface,
  accessRequestIds: string[],
  session?: ClientSession | undefined,
) {
  // Model cache
  const models: Record<string, ModelDoc> = {}

  for (const accessRequestId of accessRequestIds) {
    const accessRequest = await getAccessRequestById(user, accessRequestId)
    let model: ModelDoc
    if (accessRequest.modelId in models) {
      model = models[accessRequest.modelId]
    } else {
      model = await getModelById(user, accessRequest.modelId)
      models[accessRequest.modelId] = model
    }

    const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.Delete)
    if (!auth.success) {
      throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
    }

    const reviewsForAccessRequest = await ReviewModel.find({ accessRequestId })

    await accessRequest.delete(session)
    await removeAccessRequestReviews(accessRequestId, session)
    await removeResponsesByParentIds(
      [...reviewsForAccessRequest.map((review) => review['_id']), accessRequest['_id']] as string[],
      session,
    )
  }

  return { accessRequestIds }
}

export async function removeAccessRequest(
  user: UserInterface,
  accessRequestId: string,
  session?: ClientSession | undefined,
) {
  await removeAccessRequests(user, [accessRequestId], session)

  return { accessRequestId }
}

export async function getAccessRequestsByModel(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)
  const accessRequests = await AccessRequestModel.find({ modelId })

  const auths = await authorisation.accessRequests(user, model, accessRequests, AccessRequestAction.View)
  return accessRequests.filter((_, i) => auths[i].success)
}

export async function getAccessRequestById(user: UserInterface, accessRequestId: string) {
  const accessRequest = await AccessRequestModel.findOne({ id: accessRequestId })
  if (!accessRequest) {
    throw NotFound('The requested access request was not found.', { accessRequestId })
  }

  const model = await getModelById(user, accessRequest.modelId)

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  return accessRequest
}

export async function findAccessRequests(
  user: UserInterface,
  modelIds: Array<string>,
  schemaId: string,
  mine: boolean,
  adminAccess?: boolean,
): Promise<Array<AccessRequestDoc>> {
  if (adminAccess) {
    if (!(await authentication.hasRole(user, Roles.Admin))) {
      throw Forbidden('You do not have the required role.', {
        userDn: user.dn,
        requiredRole: Roles.Admin,
      })
    }
  }

  const query: any = {}

  if (modelIds.length) {
    query.modelId = { $in: modelIds }
  }

  if (schemaId) {
    query.schemaId = { $eq: schemaId }
  }

  if (mine) {
    query['metadata.overview.entities'] = {
      $in: await authentication.getEntities(user),
    }
  }

  const stages: PipelineStage[] = [{ $match: query }]

  //Auth already checked, so just need to check if they require admin access
  if (adminAccess) {
    const results = await AccessRequestModel.aggregate(stages)
    return results
  }

  stages.push(
    { $group: { _id: '$modelId', accessRequests: { $push: '$$ROOT' } } },
    {
      $lookup: {
        from: 'v2_models',
        localField: '_id',
        foreignField: 'id',
        as: 'model',
      },
    },
    {
      $unwind: '$model',
    },
  )

  const results = await AccessRequestModel.aggregate(stages)

  const accessRequests: AccessRequestDoc[] = []
  for (const result of results) {
    const auth = await authorisation.accessRequests(user, result.model, result.accessRequests, AccessRequestAction.View)

    const authorisedIds = new Set(auth.filter((result) => result.success).map((result) => result.id))
    const filteredAccessRequests = result.accessRequests.filter((accessRequest) => authorisedIds.has(accessRequest.id))
    accessRequests.push(...filteredAccessRequests)
  }
  return accessRequests
}

export type UpdateAccessRequestParams = Pick<AccessRequestInterface, 'metadata'>
export async function updateAccessRequest(
  user: UserInterface,
  accessRequestId: string,
  diff: Partial<UpdateAccessRequestParams>,
) {
  const accessRequest = await getAccessRequestById(user, accessRequestId)
  const model = await getModelById(user, accessRequest.modelId)

  const auth = await authorisation.accessRequest(user, model, accessRequest, AccessRequestAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, accessRequestId })
  }

  // Ensure that the AR meets the schema
  const schema = await getSchemaById(accessRequest.schemaId)
  try {
    new Validator().validate(accessRequest.metadata, schema.jsonSchema, { throwAll: true, required: true })
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Access Request Metadata could not be validated against the schema.', {
        schemaId: accessRequest.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  if (diff.metadata) {
    accessRequest.metadata = diff.metadata
    accessRequest.markModified('metadata')
  }

  await accessRequest.save()

  return accessRequest
}

export async function newAccessRequestComment(user: UserInterface, accessRequestId: string, message: string) {
  const accessRequest = await AccessRequestModel.findOne({ id: accessRequestId })

  if (!accessRequest) {
    throw NotFound(`The requested access request was not found.`, { accessRequestId })
  }

  const commentResponse = new ResponseModel({
    entity: toEntity('user', user.dn),
    kind: ResponseKind.Comment,
    comment: message,
    parentId: accessRequest._id as Types.ObjectId,
    createdAt: new Date().toISOString(),
  })

  const newComment = await commentResponse.save()

  if (!newComment) {
    throw InternalError('There was a problem saving a new comment for this access request')
  }

  return commentResponse
}

export async function getModelAccessRequestsForUser(user: UserInterface, modelId: string) {
  const accessRequests = await AccessRequestModel.find({
    modelId,
    'metadata.overview.entities': { $in: await authentication.getEntities(user) },
  })

  return accessRequests
}

export async function getCurrentUserPermissionsByAccessRequest(
  user: UserInterface,
  accessRequestId: string,
): Promise<AccessRequestUserPermissions> {
  const accessRequest = await getAccessRequestById(user, accessRequestId)
  const model = await getModelById(user, accessRequest.modelId)

  const editAccessRequestAuth = await authorisation.accessRequest(
    user,
    model,
    accessRequest,
    AccessRequestAction.Update,
  )
  const deleteAccessRequestAuth = await authorisation.accessRequest(
    user,
    model,
    accessRequest,
    AccessRequestAction.Delete,
  )

  return {
    editAccessRequest: authResponseToUserPermission(editAccessRequestAuth),
    deleteAccessRequest: authResponseToUserPermission(deleteAccessRequestAuth),
  }
}
