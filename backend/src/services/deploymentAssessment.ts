import { ClientSession } from 'mongoose'

import authentication from '../connectors/authentication/index.js'
import { DeploymentAssessmentAction, ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { z } from '../lib/zod.js'
import DeploymentAssessmentModel, {
  DeploymentAssessmentDoc,
  DeploymentAssessmentInterface,
  DeploymentAssessmentState,
  DeploymentAssessmentStateKeys,
} from '../models/DeploymentAssessment.js'
import ModelModel, { EntryKind, EntryVisibility, SystemRoles } from '../models/Model.js'
import ResponseModel, { Decision, DecisionKeys, ResponseInterface, ResponseKind } from '../models/Response.js'
import ReviewModel from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import {
  findDeploymentAssessments,
  findLatestDecisionsByAssessmentIds,
  SearchDeploymentAssessmentsParams,
} from '../repositories/deploymentAssessment.js'
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
import { getModelsByIdsNoAuth, getRoleEntities } from './model.js'
import { removeResponsesByParentIds } from './response.js'
import { removeDeploymentAssessmentReviews } from './review.js'
import { getSchemaById, validateContentAgainstSchema } from './schema.js'
import {
  notifyModelOwnersOfDeploymentApproval,
  notifyModelOwnersOfDeploymentAssessment,
  notifyReviewResponseForDeploymentAssessment,
  notifyRiskOwnerOfDeploymentAssessment,
} from './smtp/smtp.js'
import { deploymentAssessmentSchema, deploymentAssessmentSummarySchema } from './specification.js'

export const deploymentAssessmentRiskOwnerRole = 'riskOwners'

export type { SearchDeploymentAssessmentsParams }

export interface DeploymentAssessmentDetails {
  deploymentAssessment: DeploymentAssessmentDoc
  responses: ResponseInterface[]
  state?: DeploymentAssessmentStateKeys
}

// Allow partial metadata when updating to support draft updates where sections may be missing
export type UpdateDeploymentAssessmentParams = {
  metadata?: Partial<DeploymentAssessmentInterface['metadata']>
  draft?: DeploymentAssessmentInterface['draft']
  name?: DeploymentAssessmentInterface['name']
}
export type CreateDeploymentAssessmentParams = z.infer<typeof deploymentAssessmentSchema>
export type DeploymentAssessmentSummary = z.infer<typeof deploymentAssessmentSummarySchema>

async function validateRiskOwner(riskOwners: string[]) {
  for (const riskOwner of riskOwners) {
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
}

async function validateModels(user: UserInterface, modelIds: string[]) {
  const models = await ModelModel.find({ id: { $in: modelIds } })
  const modelKinds = new Set([EntryKind.Model, EntryKind.MirroredModel, EntryKind.UntrustedModel] as string[])
  const modelsById = new Set(models.map((model) => model.id))

  const missingModelIds = modelIds.filter((modelId) => !modelsById.has(modelId))
  const nonModelIds = models.filter((model) => !modelKinds.has(model.kind)).map((model) => model.id)
  if (missingModelIds.length > 0 || nonModelIds.length > 0) {
    throw BadReq('One or more models could not be found.', { modelIds: missingModelIds })
  }

  const auths = await authorisation.models(user, models, ModelAction.View)
  const unauthorisedModelIds = auths.filter((auth) => !auth.success).map((auth) => auth.id)
  if (unauthorisedModelIds.length > 0) {
    throw BadReq('You do not have permission to use one or more of the specified models.', {
      modelIds: unauthorisedModelIds,
    })
  }

  const privateModelIds = models.filter((model) => model.visibility !== EntryVisibility.Public).map((model) => model.id)
  if (privateModelIds.length > 0) {
    throw BadReq('Deployment assessments can only use public models.', { modelIds: privateModelIds })
  }

  const deployableModelState = config.ui.deploymentAssessments.deployableModelState
  if (deployableModelState !== null) {
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
}

async function validateDeploymentAssessment(
  user: UserInterface,
  schemaId: DeploymentAssessmentInterface['schemaId'],
  metadata: Partial<DeploymentAssessmentInterface['metadata']>,
  draft: DeploymentAssessmentInterface['draft'],
) {
  const { valid, errors } = await validateContentAgainstSchema(schemaId, metadata, { draft })
  if (!valid) {
    throw BadReq('Deployment assessment metadata could not be validated against the schema.', { errors })
  }

  const { riskOwners } = metadata.signOff ?? {}
  const { modelIds } = metadata.modelOverview ?? {}

  if (!draft && (!riskOwners || riskOwners.length === 0)) {
    throw BadReq('Deployment risk owner is required')
  }

  if (riskOwners && riskOwners.length > 0) {
    await validateRiskOwner(riskOwners)
  }
  if (modelIds?.length) {
    await validateModels(user, modelIds)
  }
}

async function notifyDeploymentStakeholders(
  riskOwners: string[] = [],
  modelIds: string[] = [],
  deploymentAssessment: DeploymentAssessmentInterface,
): Promise<void> {
  const uniqueRiskOwners = [...new Set(riskOwners)]
  if (uniqueRiskOwners.length === 0 && modelIds.length === 0) {
    return
  }

  try {
    const models = await ModelModel.find({
      id: { $in: modelIds },
    }).lean()

    const creator = await authentication.getUserInformation(toEntity('user', deploymentAssessment.createdBy))
    const creatorName = creator.name || deploymentAssessment.createdBy

    const notifications = [
      ...uniqueRiskOwners.map((riskOwner) =>
        notifyRiskOwnerOfDeploymentAssessment(riskOwner, deploymentAssessment, creatorName),
      ),
      ...models.flatMap((model) => {
        const owners = [
          ...new Set(
            model.collaborators
              .filter((collaborator) => collaborator.roles.includes(SystemRoles.Owner))
              .map((collaborator) => collaborator.entity),
          ),
        ]

        return owners.length
          ? [notifyModelOwnersOfDeploymentAssessment(owners, deploymentAssessment, model, creatorName)]
          : []
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

export async function getDeploymentAssessmentById(
  user: UserInterface,
  deploymentAssessmentId: string,
  session?: ClientSession,
) {
  const deploymentAssessment = await DeploymentAssessmentModel.findOne({ id: deploymentAssessmentId }, undefined, {
    session,
  })
  if (!deploymentAssessment) {
    throw NotFound('The requested deployment assessment was not found.', { deploymentAssessmentId })
  }

  const auth = await authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, deploymentAssessmentId })
  }
  return deploymentAssessment
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

/**
 * A risk owner needs to act on assessments awaiting their review, and a creator needs to act on assessments
 * that are still drafts or that have been sent back to them. Approved assessments need no further action.
 */
function needsUserAction(
  deploymentAssessment: DeploymentAssessmentInterface,
  user: UserInterface,
  state?: DeploymentAssessmentStateKeys,
) {
  if (
    deploymentAssessment.metadata.signOff?.riskOwners?.includes(toEntity('user', user.dn)) &&
    state === DeploymentAssessmentState.NeedsReview
  ) {
    return true
  }

  if (deploymentAssessment.createdBy !== user.dn) {
    return false
  }

  return (
    deploymentAssessment.draft ||
    state === DeploymentAssessmentState.Rejected ||
    state === DeploymentAssessmentState.ChangesRequested
  )
}

export async function getDeploymentAssessmentDetails(
  user: UserInterface,
  deploymentAssessmentId: string,
): Promise<DeploymentAssessmentDetails> {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId)

  if (deploymentAssessment.draft === true) {
    return {
      deploymentAssessment,
      responses: [],
    }
  }

  // Get the latest review and its corresponding responses to determine the state of this deployment assessment
  const latestReview = await getLatestDeploymentAssessmentReview(deploymentAssessmentId)
  const responses = await ResponseModel.find({ parentId: [latestReview._id, deploymentAssessment._id] })

  const latestDecision = responses.filter((r) => r.kind === ResponseKind.Review).at(0)?.decision as
    DecisionKeys | undefined
  const state = deriveDeploymentAssessmentState(deploymentAssessment, latestDecision)

  return {
    deploymentAssessment,
    responses,
    state,
  }
}

async function getLatestDeploymentAssessmentReview(deploymentAssessmentId: string) {
  const review = await ReviewModel.findOne({
    deploymentAssessmentId,
    kind: ReviewKind.DeploymentAssessment,
  }).sort({ createdAt: -1 })

  if (!review) {
    throw NotFound('The deployment assessment does not have a review.', { deploymentAssessmentId })
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
  const auth = await authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, deploymentAssessmentId })
  }

  const assessmentReviewer = toEntity('user', user.dn)
  const review = await getLatestDeploymentAssessmentReview(deploymentAssessmentId)
  const response = new ResponseModel({
    entity: assessmentReviewer,
    kind: ResponseKind.Review,
    role: review.role,
    parentId: review._id,
    decision,
    ...(comment && { comment }),
  })
  await response.save()

  await notifyDeploymentAssessmentReviewed(deploymentAssessment, decision, assessmentReviewer)

  return response
}

async function notifyDeploymentAssessmentReviewed(
  deploymentAssessment: DeploymentAssessmentInterface,
  decision: Exclude<DecisionKeys, 'undo'>,
  assessmentReviewer: string,
): Promise<void> {
  try {
    switch (decision) {
      case Decision.Reject:
      case Decision.RequestChanges:
        await notifyReviewResponseForDeploymentAssessment(deploymentAssessment, decision, assessmentReviewer)
        break

      case Decision.Approve: {
        const modelDevelopers = await getModelDevelopers(deploymentAssessment)
        await Promise.all(
          modelDevelopers.map(({ model, developers }) =>
            notifyModelOwnersOfDeploymentApproval(
              developers,
              deploymentAssessment,
              model,
              deploymentAssessment.createdBy,
            ),
          ),
        )
        break
      }
    }
  } catch (error) {
    log.warn(
      {
        error,
        deploymentAssessmentId: deploymentAssessment.id,
        decision,
      },
      'Failed to send deployment assessment review notification',
    )
  }
}

async function getModelDevelopers(deploymentAssessment: DeploymentAssessmentInterface) {
  const modelIds = deploymentAssessment.metadata.modelOverview?.modelIds ?? []
  const models = await getModelsByIdsNoAuth(modelIds)

  const modelDevelopers = models.map((model) => ({
    model,
    developers: getRoleEntities([SystemRoles.Owner], model.collaborators)[SystemRoles.Owner],
  }))

  return modelDevelopers
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
    await validateDeploymentAssessment(user, schemaId, metadata, draft)
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
    await notifyDeploymentStakeholders(
      metadata.signOff.riskOwners,
      metadata.modelOverview.modelIds ?? [],
      deploymentAssessment,
    )
  }

  return deploymentAssessment
}

export async function removeDeploymentAssessment(
  user: UserInterface,
  deploymentAssessmentId: string,
  session?: ClientSession,
) {
  const deploymentAssessment = await getDeploymentAssessmentById(user, deploymentAssessmentId, session)

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

  await validateDeploymentAssessment(
    user,
    deploymentAssessment.schemaId,
    diff.metadata ?? deploymentAssessment.metadata,
    diff.draft ?? deploymentAssessment.draft,
  )

  if (diff.name !== undefined) {
    deploymentAssessment.name = diff.name
    deploymentAssessment.markModified('name')
  }
  if (diff.metadata !== undefined) {
    // Replaced, not merged: the caller sends the whole card, so a merge would resurrect cleared answers
    deploymentAssessment.metadata = { ...diff.metadata, modelOverview: diff.metadata.modelOverview ?? {} }
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

  if (isBeingSubmitted) {
    await notifyDeploymentStakeholders(
      deploymentAssessment.metadata?.signOff?.riskOwners ?? [],
      deploymentAssessment.metadata?.modelOverview?.modelIds ?? [],
      deploymentAssessment,
    )
  }
  const review = isBeingSubmitted
    ? new ReviewModel({
        kind: ReviewKind.DeploymentAssessment,
        deploymentAssessmentId,
        role: deploymentAssessmentRiskOwnerRole,
      })
    : undefined
  await useTransaction([
    (session) => deploymentAssessment.save({ session }),
    ...(review ? [(session) => review.save({ session })] : []),
  ])

  return deploymentAssessment
}

export async function searchDeploymentAssessments(user: UserInterface, params: SearchDeploymentAssessmentsParams) {
  const deploymentAssessments = await findDeploymentAssessments(params)

  const auths = await authorisation.deploymentAssessments(user, deploymentAssessments, DeploymentAssessmentAction.View)

  const authorisedAssessments = deploymentAssessments.filter((_, index) => auths[index].success)

  const assessmentIds = authorisedAssessments.filter(({ draft }) => draft === false).map(({ id }) => id)
  const latestDecisionsByAssessmentId = await findLatestDecisionsByAssessmentIds(assessmentIds)

  const summaries: DeploymentAssessmentSummary[] = authorisedAssessments.reduce<DeploymentAssessmentSummary[]>(
    (acc, assessment) => {
      const state =
        assessment.draft !== false
          ? undefined
          : deriveDeploymentAssessmentState(assessment, latestDecisionsByAssessmentId.get(assessment.id))

      const passesFilter =
        (params.state === undefined || state === params.state) &&
        (params.needsAction === undefined || needsUserAction(assessment, user, state) === params.needsAction)

      if (passesFilter) {
        const { riskOwners } = assessment.metadata?.signOff ?? {}
        const { modelIds } = assessment.metadata?.modelOverview ?? {}
        acc.push({
          id: assessment.id,
          schemaId: assessment.schemaId,
          name: assessment.name,
          ...(riskOwners && riskOwners.length > 0 && { owner: riskOwners }),
          ...(modelIds && { models: modelIds }),
          ...(state && { state }),
          draft: assessment.draft,
          createdBy: assessment.createdBy,
          createdAt: assessment.createdAt instanceof Date ? assessment.createdAt.toISOString() : assessment.createdAt,
        })
      }

      return acc
    },
    [],
  )

  return summaries
}
