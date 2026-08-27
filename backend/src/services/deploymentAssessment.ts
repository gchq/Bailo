import { escapeRegExp } from 'lodash-es'
import { ClientSession, PipelineStage, QueryFilter } from 'mongoose'

import authentication from '../connectors/authentication/index.js'
import { DeploymentAssessmentAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { z } from '../lib/zod.js'
import DeploymentAssessmentModel, {
  DeploymentAssessmentDoc,
  DeploymentAssessmentInterface,
  DeploymentAssessmentMetadata,
  DeploymentAssessmentState,
  DeploymentAssessmentStateKeys,
} from '../models/DeploymentAssessment.js'
import ModelModel, { EntryKind, EntryVisibility, SystemRoles } from '../models/Model.js'
import ResponseModel, { Decision, DecisionKeys, ResponseInterface, ResponseKind } from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import { ReviewKind, SchemaKind } from '../types/enums.js'
import { DeploymentAssessmentUserPermissions } from '../types/types.js'
import config from '../utils/config.js'
import { fromEntity, toEntity } from '../utils/entity.js'
import { BadReq, Conflict, Forbidden, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { isMongoServerError } from '../utils/mongo.js'
import { authResponseToUserPermission } from '../utils/permissions.js'
import { useTransaction } from '../utils/transactions.js'
import log from './log.js'
import { removeResponsesByParentIds } from './response.js'
import { removeDeploymentAssessmentReviews } from './review.js'
import { getSchemaById, validateContentAgainstSchema } from './schema.js'
import { notifyDeploymentModelOwners, notifyDeploymentRiskOwner } from './smtp/smtp.js'
import { deploymentAssessmentSchema } from './specification.js'

export const deploymentAssessmentRiskOwnerRole = 'riskOwner'

export interface SearchDeploymentAssessmentsParams {
  schemaId?: string
  modelIds?: string[]
  riskOwner?: string
  createdBy?: string
  createdAfter?: string
  createdBefore?: string
  draft?: boolean
  search?: string
  state?: DeploymentAssessmentStateKeys
}

export type DeploymentAssessmentSearchResult = DeploymentAssessmentDoc & {
  state?: DeploymentAssessmentDetails['state']
}

export type UpdateDeploymentAssessmentParams = Pick<DeploymentAssessmentInterface, 'metadata' | 'draft' | 'name'>
export type CreateDeploymentAssessmentParams = z.infer<typeof deploymentAssessmentSchema>

export interface DeploymentAssessmentDetails {
  deploymentAssessment: DeploymentAssessmentDoc
  responses: ResponseInterface[]
  state?: DeploymentAssessmentStateKeys
}

async function validateRiskOwner(riskOwner: string) {
  const { kind, value } = fromEntity(riskOwner)
  if (kind !== 'user' || !value) {
    throw BadReq('The risk owner must be a valid user entity.', { riskOwner })
  }

  try {
    await authentication.getUserInformation(riskOwner)
  } catch (error) {
    throw BadReq('The risk owner could not be found.', { riskOwner, internal: error })
  }
}

async function validateModels(modelIds: string[]) {
  const models = await ModelModel.find({ id: { $in: modelIds } })
  const modelKinds = new Set([EntryKind.Model, EntryKind.MirroredModel, EntryKind.UntrustedModel] as string[])
  const modelsById = new Set(models.map((model) => model.id))

  const missingModelIds = modelIds.filter((modelId) => !modelsById.has(modelId))
  const nonModelIds = models.filter((model) => !modelKinds.has(model.kind)).map((model) => model.id)

  if (missingModelIds.length > 0 || nonModelIds.length > 0) {
    throw BadReq('One or more models could not be found.', { modelIds: missingModelIds })
  }

  const privateModelIds = models.filter((model) => model.visibility !== EntryVisibility.Public).map((model) => model.id)
  if (privateModelIds.length > 0) {
    throw BadReq('Deployment assessments can only use public models.', { modelIds: privateModelIds })
  }

  const deployableModelState = config.ui.deploymentAssessments.deployableModelState
  const nonDeployableStateModelIds = models
    .filter((model) => model.state !== deployableModelState)
    .map((model) => model.id)
  if (nonDeployableStateModelIds.length > 0) {
    throw BadReq(`Deployment assessments can only use models with a ${deployableModelState} state.`, {
      modelIds: nonDeployableStateModelIds,
      deployableModelState,
    })
  }
}

async function validateDeploymentAssessment(
  schemaId: DeploymentAssessmentInterface['schemaId'],
  metadata: DeploymentAssessmentInterface['metadata'],
  draft: DeploymentAssessmentInterface['draft'],
): Promise<DeploymentAssessmentMetadata> {
  const { valid, errors } = await validateContentAgainstSchema(schemaId, metadata, { draft })
  if (!valid) {
    throw BadReq('Deployment assessment metadata could not be validated against the schema.', { errors })
  }

  const { riskOwner, modelIds } = metadata.overview ?? {}

  if (!draft && !riskOwner) {
    throw BadReq('Deployment risk owner is required')
  }

  if (riskOwner) {
    await validateRiskOwner(riskOwner)
  }
  if (modelIds?.length) {
    await validateModels(modelIds)
  }

  return metadata
}

async function notifyDeploymentStakeholders(
  riskOwner: string,
  modelIds: string[],
  deploymentAssessment: DeploymentAssessmentInterface,
): Promise<void> {
  try {
    const models = await ModelModel.find({
      id: { $in: modelIds },
    }).lean()

    const creator = await authentication.getUserInformation(toEntity('user', deploymentAssessment.createdBy))
    const creatorName = creator.name || deploymentAssessment.createdBy

    const notifications = [
      notifyDeploymentRiskOwner(riskOwner, deploymentAssessment, creatorName),
      ...models.flatMap((model) => {
        const owners = [
          ...new Set(
            model.collaborators
              .filter((collaborator) => collaborator.roles.includes(SystemRoles.Owner))
              .map((collaborator) => collaborator.entity),
          ),
        ]

        return owners.length ? [notifyDeploymentModelOwners(owners, deploymentAssessment, model, creatorName)] : []
      }),
    ]

    const results = await Promise.allSettled(notifications)

    for (const result of results) {
      if (result.status === 'rejected') {
        log.warn(
          {
            error: result.reason,
            deploymentAssessmentId: deploymentAssessment.id,
          },
          'Failed to send deployment assessment notification',
        )
      }
    }
  } catch (error) {
    log.warn(
      {
        error,
        deploymentAssessmentId: deploymentAssessment.id,
      },
      'Failed to prepare deployment assessment notifications',
    )
  }
}

export async function getDeploymentAssessmentById(user: UserInterface, deploymentAssessmentId: string) {
  const deploymentAssessment = await DeploymentAssessmentModel.findOne({ id: deploymentAssessmentId })
  if (!deploymentAssessment) {
    throw NotFound('The requested deployment assessment was not found.', { deploymentAssessmentId })
  }

  const auth = await authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, deploymentAssessmentId })
  }

  return deploymentAssessment
}

function lookupDeploymentAssessmentReviewResponses(): PipelineStage.Lookup {
  return {
    $lookup: {
      from: 'v2_responses',
      let: { reviewId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$parentId', '$$reviewId'] },
            kind: ResponseKind.Review,
            deleted: { $ne: true },
          },
        },
        { $sort: { createdAt: -1 } },
      ],
      as: 'responses',
    },
  }
}

function deriveDeploymentAssessmentState(
  deploymentAssessment: Pick<DeploymentAssessmentInterface, 'draft'>,
  latestDecision?: DecisionKeys,
): DeploymentAssessmentStateKeys | undefined {
  if (deploymentAssessment.draft) {
    return undefined
  }

  switch (latestDecision) {
    case Decision.Approve:
      return DeploymentAssessmentState.Approved
    case Decision.Reject:
      return DeploymentAssessmentState.Rejected
    case Decision.RequestChanges:
      return DeploymentAssessmentState.ChangesRequested
    default:
      return DeploymentAssessmentState.NeedsReview
  }
}

export async function getDeploymentAssessmentDetails(
  user: UserInterface,
  deploymentAssessmentId: string,
): Promise<DeploymentAssessmentDetails> {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)
  const [comments, reviews] = await Promise.all([
    ResponseModel.find({ parentId: deploymentAssessment._id, kind: ResponseKind.Comment }),
    ReviewModel.aggregate<{ responses: ResponseInterface[] }>([
      { $match: { deploymentAssessmentId, kind: ReviewKind.DeploymentAssessment, deleted: { $ne: true } } },
      lookupDeploymentAssessmentReviewResponses(),
      { $project: { responses: 1, _id: 0 } },
    ]),
  ])

  const responses = [...comments, ...reviews.flatMap(({ responses: reviewResponses }) => reviewResponses)].sort(
    (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
  )
  const latestDecision = responses.findLast(({ kind }) => kind === ResponseKind.Review)?.decision

  return {
    deploymentAssessment,
    responses,
    state: deriveDeploymentAssessmentState(deploymentAssessment, latestDecision),
  }
}

async function getLatestDeploymentAssessmentReview(deploymentAssessmentId: string) {
  const review = await ReviewModel.findOne({
    deploymentAssessmentId,
    kind: ReviewKind.DeploymentAssessment,
  }).sort({ createdAt: -1 })

  if (!review) {
    throw NotFound('The deployment assessment does not have a review round.', { deploymentAssessmentId })
  }

  return review
}

export async function commentOnDeploymentAssessment(
  user: UserInterface,
  deploymentAssessmentId: string,
  comment: string,
) {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)
  const response = new ResponseModel({
    entity: toEntity('user', user.dn),
    kind: ResponseKind.Comment,
    parentId: deploymentAssessment._id,
    comment,
  })
  await response.save()
  return response
}

export async function reviewDeploymentAssessment(
  user: UserInterface,
  deploymentAssessmentId: string,
  decision: Exclude<DecisionKeys, 'undo'>,
  comment?: string,
) {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)
  if (deploymentAssessment.draft) {
    throw BadReq('Draft deployment assessments cannot be reviewed.', { deploymentAssessmentId })
  }
  if (deploymentAssessment.metadata.overview?.riskOwner !== toEntity('user', user.dn)) {
    throw Forbidden('Only the deployment risk owner can review a deployment assessment.', { deploymentAssessmentId })
  }

  const review = await getLatestDeploymentAssessmentReview(deploymentAssessmentId)
  const response = new ResponseModel({
    entity: toEntity('user', user.dn),
    kind: ResponseKind.Review,
    role: review.role,
    parentId: review._id,
    decision,
    ...(comment && { comment }),
  })
  await response.save()
  return response
}

export async function createDeploymentAssessment(
  user: UserInterface,
  { name, schemaId, draft, metadata }: CreateDeploymentAssessmentParams,
) {
  const schema = await getSchemaById(schemaId)
  if (schema.hidden) {
    throw BadReq('Cannot create a deployment assessment using a hidden schema.', { schemaId })
  }
  if (schema.kind !== SchemaKind.DeploymentAssessment) {
    throw BadReq('Deployment assessments must use a deployment assessment schema.', { schemaId })
  }

  if (metadata) {
    const { valid, errors } = await validateContentAgainstSchema(schemaId, metadata, { draft })
    if (!valid) {
      throw BadReq('Deployment assessment metadata could not be validated against the schema.', { errors })
    }

    if (metadata.overview.riskOwner) {
      await validateRiskOwner(metadata.overview.riskOwner)
    }
    if (metadata.overview.modelIds && metadata.overview.modelIds.length > 0) {
      await validateModels(metadata.overview.modelIds)
    }
  }

  const deploymentAssessmentId = convertStringToId(name)
  const deploymentAssessment = new DeploymentAssessmentModel({
    id: deploymentAssessmentId,
    name,
    schemaId,
    metadata: metadata ?? {},
    draft,
    createdBy: user.dn,
  })

  const review = draft
    ? undefined
    : new ReviewModel({
        kind: ReviewKind.DeploymentAssessment,
        deploymentAssessmentId,
        role: deploymentAssessmentRiskOwnerRole,
      })

  const auth = await authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, deploymentAssessmentId })
  }

  try {
    await useTransaction([
      (session) => deploymentAssessment.save({ session }),
      ...(review ? [(session) => review.save({ session })] : []),
    ])
  } catch (error) {
    if (isMongoServerError(error) && error.code === 11000) {
      throw Conflict('A deployment assessment with this ID already exists.', {
        deploymentAssessmentId: deploymentAssessment.id,
      })
    }
    throw error
  }

  if (!draft) {
    await notifyDeploymentStakeholders(metadata.overview.riskOwner, metadata.overview.modelIds, deploymentAssessment)
  }

  return deploymentAssessment
}

export async function removeDeploymentAssessment(
  user: UserInterface,
  deploymentAssessmentId: string,
  session?: ClientSession,
) {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)

  const auth = await authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.Delete)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, deploymentAssessmentId })
  }

  // Delete children before DA so that a failure part way through leaves DA so deletion safe to retry
  const reviews = await ReviewModel.find({ deploymentAssessmentId }, undefined, { session })
  await removeResponsesByParentIds(
    [deploymentAssessment._id.toString(), ...reviews.map((review) => review._id.toString())],
    session,
  )
  await removeDeploymentAssessmentReviews(deploymentAssessmentId, session)
  await deploymentAssessment.delete(session)

  return deploymentAssessment
}

export async function getCurrentUserPermissionsByDeploymentAssessment(
  user: UserInterface,
  deploymentAssessmentId: string,
): Promise<DeploymentAssessmentUserPermissions> {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)

  const [editAuth, deleteAuth] = await Promise.all([
    authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.Update),
    authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.Delete),
  ])

  return {
    editDeploymentAssessment: authResponseToUserPermission(editAuth),
    deleteDeploymentAssessment: authResponseToUserPermission(deleteAuth),
  }
}

export async function updateDeploymentAssessment(
  user: UserInterface,
  deploymentAssessmentId: string,
  diff: Partial<UpdateDeploymentAssessmentParams>,
) {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)

  const auth = await authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, deploymentAssessmentId })
  }

  const metadata = await validateDeploymentAssessment(
    deploymentAssessment.schemaId,
    diff.metadata ?? deploymentAssessment.metadata,
    diff.draft ?? deploymentAssessment.draft,
  )

  if (diff.name !== undefined) {
    deploymentAssessment.name = diff.name
    deploymentAssessment.markModified('name')
  }
  if (diff.metadata !== undefined) {
    deploymentAssessment.metadata = metadata
    deploymentAssessment.markModified('metadata')
  }

  const isBeingSubmitted = deploymentAssessment.draft && diff.draft === false
  if (diff.draft !== undefined) {
    if (!deploymentAssessment.draft && diff.draft) {
      throw BadReq('Cannot convert a submitted deployment assessment back to a draft.')
    }
    deploymentAssessment.draft = diff.draft
    deploymentAssessment.markModified('draft')
  }

  await deploymentAssessment.save()

  if (isBeingSubmitted && metadata.overview && metadata.overview.riskOwner) {
    await notifyDeploymentStakeholders(
      metadata.overview.riskOwner,
      metadata.overview.modelIds ?? [],
      deploymentAssessment,
    )
  }

  return deploymentAssessment
}

export async function searchDeploymentAssessments(user: UserInterface, params: SearchDeploymentAssessmentsParams) {
  const query: QueryFilter<DeploymentAssessmentInterface> = {}

  if (params.schemaId) {
    query.schemaId = params.schemaId
  }
  if (params.modelIds?.length) {
    query['metadata.overview.modelIds'] = { $all: params.modelIds }
  }
  if (params.riskOwner) {
    query['metadata.overview.riskOwner'] = params.riskOwner
  }
  if (params.createdBy) {
    query.createdBy = params.createdBy
  }
  if (params.createdAfter || params.createdBefore) {
    const beforeDate = params.createdBefore ? new Date(params.createdBefore) : undefined
    beforeDate?.setUTCDate(beforeDate.getUTCDate() + 1)

    query.createdAt = {
      ...(params.createdAfter && { $gte: new Date(params.createdAfter) }),
      ...(beforeDate && { $lt: beforeDate }),
    }
  }
  if (params.draft !== undefined) {
    query.draft = params.draft
  }
  if (params.search) {
    const search = { $regex: escapeRegExp(params.search), $options: 'i' }
    query.$and = [{ $or: [{ name: search }, { 'metadata.overview.justification': search }] }]
  }

  const deploymentAssessments = await DeploymentAssessmentModel.find(query).sort({ draft: -1, updatedAt: -1 })
  const auths = await authorisation.deploymentAssessments(user, deploymentAssessments, DeploymentAssessmentAction.View)

  const authorisedAssessments = deploymentAssessments.filter((_, i) => auths[i].success)
  const assessmentIds = authorisedAssessments.filter(({ draft }) => draft === false).map(({ id }) => id)
  const latestDecisions = assessmentIds.length
    ? await ReviewModel.aggregate<{ _id: string; decision?: DecisionKeys }>([
        {
          $match: {
            deploymentAssessmentId: { $in: assessmentIds },
            kind: ReviewKind.DeploymentAssessment,
            deleted: { $ne: true },
          },
        },
        lookupDeploymentAssessmentReviewResponses(),
        { $set: { responses: { $slice: ['$responses', 1] } } },
        { $unwind: { path: '$responses', preserveNullAndEmptyArrays: false } },
        { $sort: { 'responses.createdAt': -1 } },
        { $group: { _id: '$deploymentAssessmentId', decision: { $first: '$responses.decision' } } },
      ])
    : []
  const decisionsByAssessmentId = new Map(latestDecisions.map(({ _id, decision }) => [_id, decision]))

  const searchResults: DeploymentAssessmentSearchResult[] = authorisedAssessments.map((assessment) => {
    if (assessment.draft !== false) {
      return assessment
    }

    const state = deriveDeploymentAssessmentState(assessment, decisionsByAssessmentId.get(assessment.id))
    return Object.assign(assessment, { state })
  })

  return searchResults.filter(({ state }) => !params.state || state === params.state)
}
