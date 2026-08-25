import { escapeRegExp } from 'lodash-es'
import { QueryFilter } from 'mongoose'

import authentication from '../connectors/authentication/index.js'
import { DeploymentAssessmentAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import DeploymentAssessmentModel, { DeploymentAssessmentInterface } from '../models/DeploymentAssessment.js'
import ModelModel, { EntryKind, EntryVisibility, SystemRoles } from '../models/Model.js'
import { UserInterface } from '../models/User.js'
import { test } from '../routes/v3/deploymentAssessment/postDeploymentAssessment.js'
import { SchemaKind } from '../types/enums.js'
import config from '../utils/config.js'
import { fromEntity, toEntity } from '../utils/entity.js'
import { BadReq, Conflict, Forbidden, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { isMongoServerError } from '../utils/mongo.js'
import log from './log.js'
import { getSchemaById, validateContentAgainstSchema } from './schema.js'
import { notifyDeploymentModelOwners, notifyDeploymentRiskOwner } from './smtp/smtp.js'

export interface SearchDeploymentAssessmentsParams {
  schemaId?: string
  modelIds?: string[]
  riskOwner?: string
  createdBy?: string
  createdAfter?: string
  createdBefore?: string
  draft?: boolean
  search?: string
}

type CreateDeploymentAssessmentParamsBase = Pick<DeploymentAssessmentInterface, 'name' | 'schemaId'>

export type CreateDeploymentAssessmentParams =
  | (CreateDeploymentAssessmentParamsBase & { draft: true; metadata?: unknown })
  | (CreateDeploymentAssessmentParamsBase & { draft: false; metadata: unknown })

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

export async function createDeploymentAssessment(user: UserInterface, params: test) {
  const schema = await getSchemaById(params.schemaId)
  if (schema.hidden) {
    throw BadReq('Cannot create a deployment assessment using a hidden schema.', { schemaId: params.schemaId })
  }
  if (schema.kind !== SchemaKind.DeploymentAssessment) {
    throw BadReq('Deployment assessments must use a deployment assessment schema.', { schemaId: params.schemaId })
  }

  if (params.metadata) {
    const { valid, errors } = await validateContentAgainstSchema(params.schemaId, params.metadata, {
      draft: params.draft,
    })
    if (!valid) {
      throw BadReq('Deployment assessment metadata could not be validated against the schema.', { errors })
    }

    if (params.metadata.overview.riskOwner) {
      await validateRiskOwner(params.metadata.overview.riskOwner)
    }
    if (params.metadata.overview.modelIds && params.metadata.overview.modelIds.length > 0) {
      await validateModels(params.metadata.overview.modelIds)
    }
  }

  const deploymentAssessmentId = convertStringToId(params.name)
  const deploymentAssessment = new DeploymentAssessmentModel({
    id: deploymentAssessmentId,
    name: params.name,
    schemaId: params.schemaId,
    metadata: params.metadata,
    draft: params.draft,
    createdBy: user.dn,
  })

  const auth = await authorisation.deploymentAssessment(user, deploymentAssessment, DeploymentAssessmentAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, deploymentAssessmentId })
  }

  try {
    await deploymentAssessment.save()
  } catch (error) {
    if (isMongoServerError(error) && error.code === 11000) {
      throw Conflict('A deployment assessment with this ID already exists.', {
        deploymentAssessmentId: deploymentAssessment.id,
      })
    }
    throw error
  }

  if (!params.draft) {
    await notifyDeploymentStakeholders(
      params.metadata.overview.riskOwner,
      params.metadata.overview.modelIds,
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
    query.$and = [{ $or: [{ 'metadata.overview.name': search }, { 'metadata.overview.justification': search }] }]
  }

  const deploymentAssessments = await DeploymentAssessmentModel.find(query).sort({ draft: -1, updatedAt: -1 })
  const auths = await authorisation.deploymentAssessments(user, deploymentAssessments, DeploymentAssessmentAction.View)

  return deploymentAssessments.filter((_, i) => auths[i].success)
}
