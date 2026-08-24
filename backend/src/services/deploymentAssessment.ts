import { escapeRegExp } from 'lodash-es'

import authentication from '../connectors/authentication/index.js'
import { DeploymentAssessmentAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import DeploymentAssessmentModel, {
  DeploymentAssessmentInterface,
  DeploymentAssessmentMetadata,
} from '../models/DeploymentAssessment.js'
import ModelModel, { EntryKind, EntryVisibility } from '../models/Model.js'
import { UserInterface } from '../models/User.js'
import { SchemaKind } from '../types/enums.js'
import config from '../utils/config.js'
import { fromEntity } from '../utils/entity.js'
import { BadReq, Conflict, Forbidden, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { isMongoServerError } from '../utils/mongo.js'
import { getSchemaById, validateContentAgainstSchema } from './schema.js'

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

export type CreateDeploymentAssessmentParams = Pick<DeploymentAssessmentInterface, 'schemaId' | 'draft'> & {
  metadata: unknown
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

  const nonDeployableStateModelIds = models
    .filter((model) => model.state !== config.deploymentAssessments.deployableModelState)
    .map((model) => model.id)
  if (nonDeployableStateModelIds.length > 0) {
    throw BadReq(
      `Deployment assessments can only use models with a ${config.deploymentAssessments.deployableModelState.toLowerCase()} state.`,
      {
        modelIds: nonDeployableStateModelIds,
        deployableModelState: config.deploymentAssessments.deployableModelState,
      },
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

export async function createDeploymentAssessment(user: UserInterface, params: CreateDeploymentAssessmentParams) {
  const schema = await getSchemaById(params.schemaId)
  if (schema.hidden) {
    throw BadReq('Cannot create a deployment assessment using a hidden schema.', { schemaId: params.schemaId })
  }
  if (schema.kind !== SchemaKind.DeploymentAssessment) {
    throw BadReq('Deployment assessments must use a deployment assessment schema.', { schemaId: params.schemaId })
  }

  const { valid, errors } = await validateContentAgainstSchema(params.schemaId, params.metadata, {
    draft: params.draft,
  })
  if (!valid) {
    throw BadReq('Deployment assessment metadata could not be validated against the schema.', { errors })
  }

  const metadata = params.metadata as DeploymentAssessmentMetadata
  const { name, riskOwner, modelIds } = metadata.overview

  if (riskOwner) {
    await validateRiskOwner(riskOwner)
  }
  if (modelIds?.length) {
    await validateModels(modelIds)
  }

  const deploymentAssessmentId = convertStringToId(name)
  const deploymentAssessment = new DeploymentAssessmentModel({
    id: deploymentAssessmentId,
    schemaId: params.schemaId,
    metadata,
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

  return deploymentAssessment
}

export async function searchDeploymentAssessments(user: UserInterface, params: SearchDeploymentAssessmentsParams) {
  const query: Record<string, unknown> = {
    $and: [{ $or: [{ draft: false }, { draft: true, createdBy: user.dn }] }],
  }

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
    query['metadata.overview.name'] = { $regex: escapeRegExp(params.search), $options: 'i' }
  }

  return DeploymentAssessmentModel.find(query).sort({ draft: -1, updatedAt: -1 })
}
