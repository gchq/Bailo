import { uniqWith } from 'lodash-es'

import { headObject, isNoSuchKeyException } from '../clients/s3.js'
import ApprovalModel from '../models/Approval.js'
import DeploymentModelV1 from '../models/Deployment.js'
import ModelModelV1 from '../models/Model.js'
import FileModel from '../models/v2/File.js'
import ModelModelV2, { CollaboratorEntry, ModelVisibility } from '../models/v2/Model.js'
import ModelCardRevisionV2 from '../models/v2/ModelCardRevision.js'
import Release from '../models/v2/Release.js'
import ReviewModel, { Decision, ReviewResponse } from '../models/v2/Review.js'
import VersionModelV1 from '../models/Version.js'
import { ApprovalCategory, ApprovalStates, ApprovalTypes, VersionDoc } from '../types/types.js'
import { ReviewKind } from '../types/v2/enums.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import { toEntity } from '../utils/v2/entity.js'

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

async function getObjectContentLength(bucket: string, object: string) {
  let objectMeta
  try {
    objectMeta = await headObject(bucket, object)
  } catch (e) {
    if (isNoSuchKeyException(e)) {
      return
    }
    throw e
  }
  return objectMeta.ContentLength
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
  const model = await ModelModelV1.findOne({ _id: modelId }).populate('latestVersion')
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

    const v2Files: string[] = []
    const bucket = config.minio.buckets.uploads
    if (version.files.rawBinaryPath) {
      const path = version.files.rawBinaryPath
      const size = await getObjectContentLength(bucket, path)
      if (size) {
        const v2File = await FileModel.findOneAndUpdate(
          { modelId, bucket, path },
          {
            modelId,
            name: `${version.version}-rawBinaryPath.zip`,
            mime: 'application/x-zip-compressed',
            size,
            bucket,
            path,
            complete: true,

            createdAt: version.createdAt,
            updatedAt: version.updatedAt,
          },
          {
            new: true,
            upsert: true, // Make this update into an upsert
            timestamps: false,
          },
        )
        v2Files.push(v2File._id.toString())
      }
    }
    if (version.files.rawCodePath) {
      const path = version.files.rawCodePath
      const size = await getObjectContentLength(bucket, path)
      if (size) {
        const v2File = await FileModel.findOneAndUpdate(
          { modelId, bucket, path },
          {
            modelId,
            name: `${version.version}-rawCodePath.zip`,
            mime: 'application/x-zip-compressed',
            bucket,
            size,
            path,
            complete: true,

            createdAt: version.createdAt,
            updatedAt: version.updatedAt,
          },
          {
            new: true,
            upsert: true, // Make this update into an upsert
            timestamps: false,
          },
        )
        v2Files.push(v2File._id.toString())
      }
    }
    if (version.files.rawDockerPath) {
      const path = version.files.rawDockerPath
      const size = await getObjectContentLength(bucket, path)
      if (size) {
        const v2File = await FileModel.findOneAndUpdate(
          { modelId, bucket, path },
          {
            modelId,
            name: `${version.version}-rawDockerPath.tar`,
            mime: 'application/octet-stream',
            bucket,
            size,
            path,
            complete: true,

            createdAt: version.createdAt,
            updatedAt: version.updatedAt,
          },
          {
            new: true,
            upsert: true, // Make this update into an upsert
            timestamps: false,
          },
        )
        v2Files.push(v2File._id.toString())
      }
    }

    const semver = `0.0.${i + 1}`
    await Release.findOneAndUpdate(
      { modelId, semver },
      {
        modelId,
        modelCardVersion: i,

        semver,
        notes: `Migrated from V1. Orginal version ID: ${version.version}`,

        minor: false,
        draft: false,

        fileIds: v2Files,
        // Not sure about images
        images: [],

        createdBy: 'system',
        createdAt: version.createdAt,
        updatedAt: version.updatedAt,
      },

      {
        new: true,
        upsert: true, // Make this update into an upsert
        timestamps: false,
      },
    )

    const versionApprovals = await ApprovalModel.find({
      version: version._id,
      approvalCategory: ApprovalCategory.Upload,
    }).sort({ createdAt: 1 })

    for (const approval of versionApprovals) {
      let role
      if (approval.approvalType === ApprovalTypes.Manager) {
        role = 'msro'
      } else if (approval.approvalType === ApprovalTypes.Reviewer) {
        role = 'mtr'
      }

      const responses: ReviewResponse[] = []
      for (let i = 0; i < approval.approvers.length; i++) {
        const approver = approval.approvers[i]
        if (approval.status === ApprovalStates.Accepted) {
          responses.push({
            user: toEntity('user', approver.id),
            decision: Decision.Approve,
            comment: `Migrated from V1. Overall V1 approval decision to V2 individual user responses for the given role.`,
            createdAt: approval.createdAt,
            updatedAt: approval.updatedAt,
          })
        } else if (approval.status === ApprovalStates.Declined) {
          responses.push({
            user: toEntity('user', approver.id),
            decision: Decision.RequestChanges,
            comment: `Migrated from V1. Overall V1 approval decision to V2 individual user responses for the given role.`,
            createdAt: approval.createdAt,
            updatedAt: approval.updatedAt,
          })
        }
      }
      await ReviewModel.findOneAndUpdate(
        { modelId, semver, role },
        {
          semver,
          modelId,

          kind: ReviewKind.Release,
          role,

          responses,

          createdAt: approval.createdAt,
          updatedAt: approval.updatedAt,
        },
        {
          new: true,
          upsert: true, // Make this update into an upsert
          timestamps: false,
        },
      )
    }
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

await migrateAllModels()
//await migrateModel('minimal-model-for-testing-im7q59')

setTimeout(disconnectFromMongoose, 500)
