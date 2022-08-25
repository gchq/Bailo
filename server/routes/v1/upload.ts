import multer from 'multer'
import config from 'config'
import { v4 as uuidv4 } from 'uuid'
import { customAlphabet } from 'nanoid'
import * as Minio from 'minio'

import { validateSchema } from '../../utils/validateSchema'
import { normalizeMulterFile } from '../../utils/multer'
import MinioStore from '../../utils/MinioStore'
import { getUploadQueue } from '../../utils/queues'
import { ensureUserRole } from '../../utils/user'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

import { createVersionRequests } from '../../services/request'
import { BadReq, Conflict, GenericError } from '../../utils/result'
import { findModelByUuid, createModel } from '../../services/model'
import { createVersion } from '../../services/version'
import { findSchemaByRef } from '../../services/schema'
import _ from 'lodash'
import { updateDeploymentVersions } from '../../services/deployment'

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
      const mode = req.query.mode as string
      const modelUuid = req.query.modelUuid as string

      if (!files.binary) {
        throw BadReq({ code: 'binary_file_not_found' }, 'Unable to find binary file')
      }

      if (!files.code) {
        throw BadReq({ code: 'code_file_not_found' }, 'Unable to find code file')
      }

      if (!files.binary[0].originalname.toLowerCase().endsWith('.zip')) {
        req.log.warn(
          { code: 'binary_wrong_file_type', filename: files.binary[0].originalname },
          'Binary is not a zip file'
        )
        return res.status(400).json({
          message: `Unable to process binary, file not a zip.`,
        })
      }

      if (!files.code[0].originalname.toLowerCase().endsWith('.zip')) {
        req.log.warn({ code: 'code_wrong_file_type', filename: files.code[0].originalname }, 'Code is not a zip file')
        return res.status(400).json({
          message: `Unable to process code, file not a zip.`,
        })
      }

      let metadata

      try {
        metadata = JSON.parse(req.body.metadata)
      } catch (e) {
        req.log.warn({ code: 'metadata_invalid_json', metadata: req.body.metadata }, 'Metadata is not valid JSON')
        return res.status(400).json({
          message: `Unable to parse schema as JSON`,
        })
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
        version = await createVersion(req.user!, {
          version: metadata.highLevelDetails.modelCardVersion,
          metadata: metadata,
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
        const parentModel = await findModelByUuid(req.user!, req.body.parent)

        if (!parentModel) {
          req.log.warn({ code: 'model_parent_not_found', parent: req.body.parent }, 'Could not find parent')
          return res.status(400).json({
            message: `Unable to find parent with uuid: '${req.body.parent}'`,
          })
        }

        parentId = parentModel._id
      }

      /** Saving the model **/

      let model: any = undefined

      if (mode === 'newVersion') {
        // Update an existing model's version array
        const modelUuid = req.query.modelUuid

        model = await findModelByUuid(req.user!, modelUuid as string)
        model.versions.push(version._id)
        model.currentMetadata = metadata

        // Find all existing deployments for this model and update their versions array
        await updateDeploymentVersions(req.user!, model._id, version)
      } else {
        // Save a new model, and add the uploaded version to its array
        model = await createModel(req.user!, {
          schemaRef: metadata.schemaRef,
          uuid: `${name}-${nanoid()}`,

          parent: parentId,
          versions: [version._id],
          currentMetadata: metadata,

          owner: req.user!._id,
        })
      }

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

      const jobId = await (
        await getUploadQueue()
      ).add({
        versionId: version._id,
        userId: req.user?._id,
        binary: normalizeMulterFile(files.binary[0]),
        code: normalizeMulterFile(files.code[0]),
      })
      req.log.info({ code: 'created_upload_job', jobId }, 'Successfully created job in upload queue')

      // then return reference to user
      res.json({
        uuid: model.uuid,
      })

      try {
        const binaryLocation = `model/${model._id}/version/${version._id}/raw/binary/${uuidv4()}`
        const client = new Minio.Client(config.get('minio'))
        await client.copyObject(
          files.binary[0].bucket,
          binaryLocation,
          `${files.binary[0].bucket}/${files.binary[0].path}`,
          new Minio.CopyConditions()
        )
        await client.removeObject(files.binary[0].bucket, files.binary[0].path)

        const codeLocation = `model/${model._id}/version/${version._id}/raw/code/${uuidv4()}`
        await client.copyObject(
          files.code[0].bucket,
          codeLocation,
          `${files.code[0].bucket}/${files.code[0].path}`,
          new Minio.CopyConditions()
        )
        await client.removeObject(files.code[0].bucket, files.code[0].path)

        version.rawBinaryPath = binaryLocation
        version.rawCodePath = codeLocation
        version.save()
      } catch (e: any) {
        throw GenericError({}, 'Error uploading raw code and binary to Minio', 500)
      }
    })
  },
]
