import authentication from '../connectors/authentication/index.js'
import DeploymentAssessmentModel, { DeploymentAssessmentInterface } from '../models/DeploymentAssessment.js'
import ModelModel, { EntryKind, EntryVisibility } from '../models/Model.js'
import { UserInterface } from '../models/User.js'
import { SchemaKind } from '../types/enums.js'
import config from '../utils/config.js'
import { fromEntity } from '../utils/entity.js'
import { BadReq, Conflict } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { isMongoServerError } from '../utils/mongo.js'
import { getSchemaById, validateContentAgainstSchema } from './schema.js'

export type CreateDeploymentAssessmentParams = Pick<DeploymentAssessmentInterface, 'schemaId' | 'metadata' | 'draft'>

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
  const models = await ModelModel.find({ id: { $in: modelIds }, deleted: { $ne: true } })
  const modelsById = new Map(models.map((model) => [model.id, model]))

  const missingModelIds = modelIds.filter((modelId) => !modelsById.has(modelId))

  if (missingModelIds.length > 0) {
    throw BadReq('One or more referenced models could not be found.', { modelIds: missingModelIds })
  }

  const nonModelIds = models.filter((model) => model.kind !== EntryKind.Model).map((model) => model.id)
  if (nonModelIds.length > 0) {
    throw BadReq('Deployment assessments can only reference models.', { modelIds: nonModelIds })
  }

  const privateModelIds = models.filter((model) => model.visibility !== EntryVisibility.Public).map((model) => model.id)
  if (privateModelIds.length > 0) {
    throw BadReq('Deployment assessments can only reference public models.', { modelIds: privateModelIds })
  }

  const nonLiveModelIds = models
    .filter((model) => model.state !== config.deploymentAssessments.deployableModelState)
    .map((model) => model.id)
  if (nonLiveModelIds.length > 0) {
    throw BadReq('Deployment assessments can only reference live models.', {
      modelIds: nonLiveModelIds,
      deployableModelState: config.deploymentAssessments.deployableModelState,
    })
  }
}

export async function createDeploymentAssessment(user: UserInterface, params: CreateDeploymentAssessmentParams) {
  const { name, riskOwner, models } = params.metadata.overview
  if (new Set(models).size !== models.length) {
    throw BadReq('A model cannot be referenced more than once.', { modelIds: models })
  }

  const schema = await getSchemaById(params.schemaId)
  if (schema.hidden) {
    throw BadReq('Cannot create a deployment assessment using a hidden schema.', { schemaId: params.schemaId })
  }
  if (schema.kind !== SchemaKind.DeploymentAssessment) {
    throw BadReq('Deployment assessments must use a deployment assessment schema.', { schemaId: params.schemaId })
  }

  const { valid, errors } = await validateContentAgainstSchema(params.schemaId, params.metadata)
  if (!valid) {
    throw BadReq('Deployment assessment metadata could not be validated against the schema.', { errors })
  }

  await validateRiskOwner(riskOwner)
  if (!params.draft) {
    await validateModels(models)
  }

  const deploymentAssessment = new DeploymentAssessmentModel({
    id: convertStringToId(name),
    schemaId: params.schemaId,
    metadata: params.metadata,
    draft: params.draft,
    createdBy: user.dn,
  })

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
