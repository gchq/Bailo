import config from 'config'
import { Request, Response } from 'express'
import multer from 'multer'
import { customAlphabet } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'
import { moveFile } from '../../utils/minio'
import { createFileRef } from '../../utils/multer'
import { updateDeploymentVersions } from '../../services/deployment'
import { createModel, findModelByUuid } from '../../services/model'
import { createVersionRequests } from '../../services/request'
import { findSchemaByRef } from '../../services/schema'
import { createVersion, markVersionBuilt } from '../../services/version'
import MinioStore from '../../utils/MinioStore'
import { getUploadQueue } from '../../utils/queues'
import { BadReq, Conflict, GenericError } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'
import { validateSchema } from '../../utils/validateSchema'
import VersionModel from '../../models/Version'
import { ModelUploadType, SeldonVersion, UploadModes } from '../../../types/interfaces'
import { getPropertyFromEnumValue } from '../../utils/general'

export type MinioFile = Express.Multer.File & { bucket: string }
export interface MulterFiles {
  [fieldname: string]: Array<MinioFile>
}

const upload = multer({
  storage: new MinioStore({
    connection: config.get('minio'),
    bucket: () => config.get('minio.uploadBucket'),
    path: () => uuidv4(),
  }),
  limits: { fileSize: 34359738368 },
})

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

function parseMetadata(stringMetadata: string) {
  let metadata

  try {
    metadata = JSON.parse(stringMetadata)
  } catch (e) {
    throw BadReq({ code: 'metadata_invalid_json', metadata: stringMetadata }, 'Metadata is not valid JSON')
  }

  return metadata
}

async function getMetadataSchema(metadata: any) {
  const schema = await findSchemaByRef(metadata.schemaRef)
  if (!schema) {
    throw BadReq({ code: 'schema_not_found', schemaRef: metadata.schemaRef }, 'Schema not found')
  }

  return schema
}

function validateMetadata(metadata: any, schema: any) {
  const schemaIsInvalid = validateSchema(metadata, schema.schema)
  if (schemaIsInvalid) {
    throw BadReq({ code: 'metadata_did_not_validate', errors: schemaIsInvalid }, 'Metadata did not validate correctly')
  }
}

function checkZipFile(name: string, file: Array<MinioFile>) {
  if (!file.length) {
    throw BadReq({ code: 'file_not_found', name }, `Expected '${name}' file to be uploaded.`)
  }

  if (!file[0].originalname.toLowerCase().endsWith('.zip')) {
    throw BadReq({ code: 'file_not_zip', name }, `Expected '${name}' to be a zip file.`)
  }
}

function checkTarFile(name: string, file: Array<MinioFile>) {
  if (!file.length) {
    throw BadReq({ code: 'file_not_found', name }, `Expected '${name}' file to be uploaded.`)
  }

  if (!file[0].originalname.toLowerCase().endsWith('.tar')) {
    throw BadReq({ code: 'file_not_tar', name }, `Expected '${name}' to be a tar file.`)
  }
}

function checkSeldonVersion(seldonVersion: string) {
  const seldonVersionsFromConfig: Array<SeldonVersion> = config.get('uiConfig.seldonVersions')
  if (seldonVersionsFromConfig.filter((version) => version.image === seldonVersion).length === 0) {
    throw BadReq({ seldonVersion }, `Seldon version ${seldonVersion} not recognised`)
  }
}

export const postUpload = [
  ensureUserRole('user'),
  upload.fields([{ name: 'binary' }, { name: 'code' }, { name: 'docker' }]),
  async (req: Request, res: Response) => {
    const metadata = parseMetadata(req.body.metadata)
    metadata.timeStamp = new Date().toISOString()

    const schema = await getMetadataSchema(metadata)

    validateMetadata(metadata, schema)

    const files = req.files as unknown as MulterFiles
    const uploadType = metadata.buildOptions.uploadType as ModelUploadType

    switch (uploadType) {
      case ModelUploadType.Zip:
        checkZipFile('binary', files.binary)
        checkZipFile('code', files.code)
        checkSeldonVersion(metadata.buildOptions.seldonVersion)
        break
      case ModelUploadType.Docker:
        checkTarFile('docker', files.docker)
        break
      case ModelUploadType.ModelCard:
        // No files to check here!
        break
      default:
        throw BadReq({ uploadType }, 'Unknown upload type')
    }

    let mode: UploadModes

    const prop = typeof req.query.mode === 'string' ? getPropertyFromEnumValue(UploadModes, req.query.mode) : undefined

    if (!req.query.mode) {
      mode = UploadModes.NewModel
    } else if (prop) {
      mode = prop as UploadModes
    } else {
      throw BadReq(
        { code: 'upload_mode_invalid' },
        `Upload mode ${req.query.mode} is not valid.  Must be one of ${Object.keys(UploadModes).join(', ')}.`
      )
    }

    const modelUuid = req.query.modelUuid as string
    const name = metadata.highLevelDetails.name
      .toLowerCase()
      .replace(/[^a-z 0-9]/g, '')
      .replace(/ /g, '-')

    /** Saving the model */
    let model: any

    if (mode === UploadModes.NewVersion) {
      // Update an existing model's version array
      model = await findModelByUuid(req.user, modelUuid)
    } else {
      // Save a new model, and add the uploaded version to its array
      model = await createModel(req.user, {
        schemaRef: metadata.schemaRef,
        uuid: `${name}-${nanoid()}`,

        versions: [],
        currentMetadata: metadata,
      })
    }

    let version
    try {
      version = await createVersion(req.user, {
        version: metadata.highLevelDetails.modelCardVersion,
        metadata,
        files: {},
      })
    } catch (err: any) {
      if (err.code === 11000) {
        throw Conflict(
          {
            version: metadata.highLevelDetails.modelCardVersion,
            model: modelUuid,
          },
          'This model already has a version with the same name'
        )
      }

      throw err
    }

    req.log.info({ code: 'created_model_version', version }, 'Created model version')

    model.versions.push(version._id)
    model.currentMetadata = metadata

    // Find all existing deployments for this model and update their versions array
    await updateDeploymentVersions(req.user, model._id, version)

    await model.save()

    version.model = model._id
    await version.save()

    req.log.info({ code: 'created_model', model }, 'Created model document')

    const [managerRequest, reviewerRequest] = await createVersionRequests({
      version: await version.populate('model').execPopulate(),
    })
    req.log.info(
      { code: 'created_review_requests', managerId: managerRequest._id, reviewRequest: reviewerRequest._id },
      'Successfully created requests for reviews'
    )

    switch (uploadType) {
      case ModelUploadType.ModelCard:
        await markVersionBuilt(version._id)
        break
      case ModelUploadType.Zip:
        try {
          const bucket = config.get('minio.uploadBucket') as string

          const binaryFrom = `${files.binary[0].bucket}/${files.binary[0].path}`
          const rawBinaryPath = `model/${model._id}/version/${version._id}/raw/binary/${files.binary[0].path}`
          await moveFile(bucket, binaryFrom, rawBinaryPath)

          const codeFrom = `${files.code[0].bucket}/${files.code[0].path}`
          const rawCodePath = `model/${model._id}/version/${version._id}/raw/code/${files.code[0].path}`
          await moveFile(bucket, codeFrom, rawCodePath)

          await VersionModel.findOneAndUpdate({ _id: version._id }, { files: { rawCodePath, rawBinaryPath } })
          req.log.info(
            { code: 'adding_file_paths', rawCodePath, rawBinaryPath },
            `Adding paths for raw model exports of files to version.`
          )
        } catch (e: any) {
          throw GenericError({ e }, 'Error uploading raw code and binary to Minio', 500)
        }

        break
      case ModelUploadType.Docker: {
        const bucket = config.get('minio.uploadBucket') as string

        const binaryFrom = `${files.docker[0].bucket}/${files.docker[0].path}`
        const rawDockerPath = `model/${model._id}/version/${version._id}/raw/docker/${files.docker[0].path}`

        req.log.info({ bucket, binaryFrom, rawDockerPath })
        await moveFile(bucket, binaryFrom, rawDockerPath)

        await VersionModel.findOneAndUpdate({ _id: version._id }, { files: { rawDockerPath } })

        break
      }
      default:
        throw BadReq({}, 'Unexpected model upload type')
    }

    await version.save()

    if (uploadType === ModelUploadType.Zip) {
      const jobId = await (
        await getUploadQueue()
      ).add({
        versionId: version._id,
        userId: req.user._id,
        binary: createFileRef(files.binary[0], 'binary', version),
        code: createFileRef(files.code[0], 'code', version),
        uploadType,
      })

      req.log.info({ code: 'created_upload_job', jobId }, 'Successfully created zip job in upload queue')
    }

    if (uploadType === ModelUploadType.Docker) {
      const jobId = await (
        await getUploadQueue()
      ).add({
        versionId: version._id,
        userId: req.user._id,
        docker: createFileRef(files.docker[0], 'docker', version),
        uploadType,
      })

      req.log.info({ code: 'created_upload_job', jobId }, 'Successfully created docker job in upload queue')
    }

    return res.json({
      uuid: model.uuid,
    })
  },
]
