import config from 'config'
import { Request, Response } from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import { customAlphabet } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'
import { copyFile, getClient } from '../../utils/minio'
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
import { ModelUploadType, UploadModes } from '../../../types/interfaces'

export interface MinioFile {
  [fieldname: string]: Array<Express.Multer.File & { bucket: string }>
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

export const postUpload = [
  ensureUserRole('user'),
  upload.fields([{ name: 'binary' }, { name: 'code' }]),
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession()
    return session.withTransaction(async () => {
      const files = req.files as unknown as MinioFile
      const mode = (req.query.mode as string) || UploadModes.NewModel
      const modelUuid = req.query.modelUuid as string

      let metadata

      try {
        metadata = JSON.parse(req.body.metadata)
      } catch (e) {
        req.log.warn({ code: 'metadata_invalid_json', metadata: req.body.metadata }, 'Metadata is not valid JSON')
        return res.status(400).json({
          message: `Unable to parse schema as JSON`,
        })
      }

      const uploadType = metadata.buildOptions.uploadType as ModelUploadType

      if (metadata.uploadType === ModelUploadType.Zip && !files.binary) {
        throw BadReq({ code: 'binary_file_not_found' }, 'Unable to find binary file')
      }

      if (uploadType === ModelUploadType.Zip && !files.code) {
        throw BadReq({ code: 'code_file_not_found' }, 'Unable to find code file')
      }

      if (uploadType === ModelUploadType.Zip && !files.binary[0].originalname.toLowerCase().endsWith('.zip')) {
        req.log.warn(
          { code: 'binary_wrong_file_type', filename: files.binary[0].originalname },
          'Binary is not a zip file'
        )
        return res.status(400).json({
          message: `Unable to process binary, file not a zip.`,
        })
      }

      if (uploadType === ModelUploadType.Zip && !files.code[0].originalname.toLowerCase().endsWith('.zip')) {
        req.log.warn({ code: 'code_wrong_file_type', filename: files.code[0].originalname }, 'Code is not a zip file')
        return res.status(400).json({
          message: `Unable to process code, file not a zip.`,
        })
      }

      if (!Object.values(UploadModes).includes(mode as UploadModes)) {
        throw BadReq(
          { code: 'upload_mode_invalid' },
          `Upload mode '${mode}' is not valid. Must be either 'newModel' or 'newVersion'`
        )
      }

      const schema = await findSchemaByRef(metadata.schemaRef)
      if (!schema) {
        req.log.warn({ code: 'schema_not_found', schemaRef: metadata.schemaRef }, 'Schema not found')
        return res.status(400).json({
          message: `Unable to find schema with name: '${metadata.schemaRef}'`,
        })
      }

      metadata.timeStamp = new Date().toISOString()

      // first, we verify the schema
      const schemaIsInvalid = validateSchema(metadata, schema.schema)
      if (schemaIsInvalid) {
        req.log.warn(
          { code: 'metadata_did_not_validate', errors: schemaIsInvalid },
          'Metadata did not validate correctly'
        )
        return res.status(400).json({
          errors: schemaIsInvalid,
        })
      }

      let version
      try {
        version = await createVersion(req.user, {
          version: metadata.highLevelDetails.modelCardVersion,
          metadata,
          files: {
            rawBinaryPath: '',
            rawCodePath: '',
          },
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

      const name = metadata.highLevelDetails.name
        .toLowerCase()
        .replace(/[^a-z 0-9]/g, '')
        .replace(/ /g, '-')

      let parentId
      if (req.body.parent) {
        req.log.info({ code: 'model_parent_already_exists', parent: req.body.parent }, 'Uploaded model has parent')
        const parentModel = await findModelByUuid(req.user, req.body.parent)

        if (!parentModel) {
          req.log.warn({ code: 'model_parent_not_found', parent: req.body.parent }, 'Could not find parent')
          return res.status(400).json({
            message: `Unable to find parent with uuid: '${req.body.parent}'`,
          })
        }

        parentId = parentModel._id
      }

      /** Saving the model */

      let model: any

      if (mode === UploadModes.NewVersion) {
        // Update an existing model's version array
        model = await findModelByUuid(req.user, modelUuid)
        model.versions.push(version._id)
        model.currentMetadata = metadata

        // Find all existing deployments for this model and update their versions array
        await updateDeploymentVersions(req.user, model._id, version)
      } else {
        // Save a new model, and add the uploaded version to its array
        model = await createModel(req.user, {
          schemaRef: metadata.schemaRef,
          uuid: `${name}-${nanoid()}`,

          parent: parentId,
          versions: [version._id],
          currentMetadata: metadata,

          owner: req.user._id,
        })
      }

      await model.save()

      version.model = model._id

      req.log.info({ code: 'created_model', model }, 'Created model document')

      const [managerRequest, reviewerRequest] = await createVersionRequests({
        version: await version.populate('model').execPopulate(),
      })
      req.log.info(
        { code: 'created_review_requests', managerId: managerRequest._id, reviewRequest: reviewerRequest._id },
        'Successfully created requests for reviews'
      )

      if (uploadType === ModelUploadType.ModelCard) {
        await markVersionBuilt(version._id)
      } else {
        await version.save()
      }

      if (uploadType === ModelUploadType.Zip) {
        const jobId = await (
          await getUploadQueue()
        ).add({
          versionId: version._id,
          userId: req.user?._id,
          binary: createFileRef(files.binary[0], 'binary', version),
          code: createFileRef(files.code[0], 'code', version),
        })

        req.log.info({ code: 'created_upload_job', jobId }, 'Successfully created job in upload queue')

        try {
          const rawBinaryPath = `model/${model._id}/version/${version._id}/raw/binary/${files.binary[0].path}`
          const client = getClient()
          await copyFile(`${files.binary[0].bucket}/${files.binary[0].path}`, rawBinaryPath)
          await client.removeObject(files.binary[0].bucket, files.binary[0].path)
          const rawCodePath = `model/${model._id}/version/${version._id}/raw/code/${files.code[0].path}`
          await copyFile(`${files.code[0].bucket}/${files.code[0].path}`, rawCodePath)
          await client.removeObject(files.code[0].bucket, files.code[0].path)
          await VersionModel.findOneAndUpdate({ _id: version._id }, { files: { rawCodePath, rawBinaryPath } })
          req.log.info(
            { code: 'adding_file_paths', rawCodePath, rawBinaryPath },
            `Adding paths for raw model exports of files to version.`
          )
        } catch (e: any) {
          throw GenericError({}, 'Error uploading raw code and binary to Minio', 500)
        }
      }

      return res.json({
        uuid: model.uuid,
      })
    })
  },
]
