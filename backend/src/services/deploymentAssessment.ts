import authentication from '../connectors/authentication/index.js'
import DeploymentAssessmentModel, {
  DeploymentAssessmentInterface,
  DeploymentAssessmentMetadata,
} from '../models/DeploymentAssessment.js'
import ModelModel, { EntryKind, EntryVisibility, SystemRoles } from '../models/Model.js'
import { UserInterface } from '../models/User.js'
import { SchemaKind } from '../types/enums.js'
import config from '../utils/config.js'
import { fromEntity, toEntity } from '../utils/entity.js'
import { BadReq, Conflict } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { isMongoServerError } from '../utils/mongo.js'
import log from './log.js'
import { getSchemaById, validateContentAgainstSchema } from './schema.js'
import { notifyDeploymentModelOwners, notifyDeploymentRiskOwner } from './smtp/smtp.js'

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

  if (!params.draft && !riskOwner) {
    throw BadReq('Deployment risk owner is required')
  }

  if (riskOwner) {
    await validateRiskOwner(riskOwner)
  }
  if (modelIds?.length) {
    await validateModels(modelIds)
  }

  const deploymentAssessment = new DeploymentAssessmentModel({
    id: convertStringToId(name),
    schemaId: params.schemaId,
    metadata,
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

  if (!params.draft && riskOwner) {
    await notifyDeploymentStakeholders(riskOwner, modelIds ?? [], deploymentAssessment)
  }

  return deploymentAssessment
}
