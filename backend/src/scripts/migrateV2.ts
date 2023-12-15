import { uniqWith } from 'lodash-es'

import DeploymentModelV1 from '../models/Deployment.js'
import ModelModelV1 from '../models/Model.js'
import ModelModelV2, { CollaboratorEntry, ModelVisibility } from '../models/v2/Model.js'
import ModelCardRevisionV2 from '../models/v2/ModelCardRevision.js'
import VersionModelV1 from '../models/Version.js'
import { VersionDoc } from '../types/types.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

const MODEL_SCHEMA_MAP = {
  '/Minimal/General/v10': {
    convert: (metadata) => {
      return {
        overview: {
          modelSummary: metadata.highLevelDetails.modelOverview,
          tags: metadata.highLevelDetails.tags,
        },
      }
    },
    schema: 'minimal-general-v10-beta',
  },
}

const _DEPLOYMENT_SCHEMA_MAP = {
  '/Minimal/Deployment/v6': {
    convert: (metadata) => {
      return {
        overview: {
          name: metadata.highLevelDetails.title,
          endDate: metadata.highLevelDetails.endDate.hasEndDate ? metadata.highLevelDetails.endDate.date : undefined,
          entities: metadata.contacts.owner.map((entity) => `${entity.kind}:${identityConversion(entity.id)}`),
        },
      }
    },
    schema: 'minimal-access-request-general-v10-beta',
  },
}

function identityConversion(old: string) {
  return old
}

export async function migrateAllModels() {
  const models = await ModelModelV1.find({})
  for (const model of models) {
    await migrateModel(model.id)
  }
}

async function migrateModel(modelId: string) {
  const model = await ModelModelV1.findOne({ uuid: modelId }).populate('latestVersion')
  if (!model) throw new Error(`Model not found: ${modelId}`)
  model.latestVersion = model.latestVersion as VersionDoc

  const versions = await VersionModelV1.find({ model }).sort({ createdAt: 1 })
  if (!versions.length) throw new Error(`Expected more versions for model: ${modelId}`)

  const collaborators: Array<CollaboratorEntry> = []

  for (const manager of model.latestVersion.metadata.contacts.manager) {
    collaborators.push({
      entity: `${manager.kind}:${identityConversion(manager.id)}`,
      roles: ['msro', 'owner'],
    })
  }

  for (const reviewer of model.latestVersion.metadata.contacts.reviewer) {
    const entity = `${reviewer.kind}:${identityConversion(reviewer.id)}`

    const search = collaborators.find((entry) => entry.entity === entity)
    if (search) {
      search.roles.push('mtr')

      if (!search.roles.includes('owner')) {
        search.roles.push('owner')
      }
    } else {
      collaborators.push({
        entity,
        roles: ['mtr', 'owner'],
      })
    }
  }

  for (const uploader of model.latestVersion.metadata.contacts.uploader) {
    const entity = `${uploader.kind}:${identityConversion(uploader.id)}`

    const search = collaborators.find((entry) => entry.entity === entity)
    if (search) {
      if (!search.roles.includes('owner')) {
        search.roles.push('owner')
      }
    } else {
      collaborators.push({
        entity,
        roles: ['owner'],
      })
    }
  }

  const modelV2 = await ModelModelV2.findOneAndUpdate(
    { id: modelId },
    {
      id: modelId,

      name: model.latestVersion.metadata.highLevelDetails.name,
      description: model.latestVersion.metadata.highLevelDetails.modelInASentence,

      collaborators,
      settings: {
        ungovernedAccess: false,
      },

      visibility: ModelVisibility.Public,

      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    },
    {
      new: true,
      upsert: true, // Make this update into an upsert
      timestamps: false,
    },
  )

  const { convert, schema } = MODEL_SCHEMA_MAP[model.schemaRef]
  const uniqueVersions = await uniqWith(versions, (a, b) => a.version === b.version)

  for (let i = 0; i < uniqueVersions.length; i++) {
    const version = uniqueVersions[i]
    const newMetadata = convert(version.metadata)

    await ModelCardRevisionV2.findOneAndUpdate(
      {
        modelId,
        version: 0,
      },
      {
        modelId,
        schemaId: schema,

        version: i,
        metadata: newMetadata,

        createdBy: 'system',
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
      {
        new: true,
        upsert: true, // Make this update into an upsert
        timestamps: false,
      },
    )
  }

  modelV2.card = {
    metadata: convert(uniqueVersions[uniqueVersions.length - 1].metadata),
    schemaId: schema,
    version: uniqueVersions.length - 1,
    createdBy: 'system',
  }

  await modelV2.save()

  const _deployments = await DeploymentModelV1.find({
    model,
  })
}

await connectToMongoose()

// await migrateAllModels()
await migrateModel('minimal-model-for-testing-im7q59')

setTimeout(disconnectFromMongoose, 500)
