import multer from 'multer'
import config from 'config'
import { v4 as uuidv4 } from 'uuid'
import { customAlphabet } from 'nanoid'

import ModelModel from '../../models/Model'
import { validateSchema } from '../../utils/validateSchema'
import SchemaModel from '../../models/Schema'
import { normalizeMulterFile } from '../../utils/multer'
import MinioStore from '../../utils/MinioStore'
import { uploadQueue } from '../../utils/queues'
import VersionModel from '../../models/Version'
import { ensureUserRole } from '../../utils/user'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

import { createVersionRequests } from '../../services/request'
import { BadReq, Conflict } from 'server/utils/result'

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
      const mode = req.query.mode

      if (!files.binary[0].originalname.toLowerCase().endsWith('.zip')) {
        throw BadReq(
          { filename: files.binary[0].originalname },
          `Unable to process binary, file not a zip.`
        )
      }

      if (!files.code[0].originalname.toLowerCase().endsWith('.zip')) {
        throw BadReq(
          { filename: files.code[0].originalname },
          `Unable to process code, file not a zip.`
        )
      }

      let metadata

      try {
        metadata = JSON.parse(req.body.metadata)
      } catch (e) {
        throw BadReq(
          { metadata: req.body.metadata },
          `Unable to parse schema as JSON`
        )
      }

      const schema = await SchemaModel.findOne({
        reference: metadata.schemaRef,
      })

      if (!schema) {
        throw BadReq(
          { schemaRef: metadata.schemaRef },
          `Unable to find schema with name: '${metadata.schemaRef}'`
        )
      }

      metadata.timeStamp = new Date().toISOString()

      // first, we verify the schema
      const schemaIsInvalid = validateSchema(metadata, schema.schema)
      if (schemaIsInvalid) {
        req.log.warn({ errors: schemaIsInvalid }, 'Metadata did not validate correctly')
        return res.status(400).json({
          errors: schemaIsInvalid,
        })
      }

      // create a version instance
      const version = new VersionModel({
        version: metadata.highLevelDetails.modelCardVersion,
        metadata: metadata,
      })

      try {
        await version.save()
      } catch (err: any) {
        if (err.toString().includes('duplicate key error')) {
          throw Conflict(
            {},
            `Duplicate version name found for model '${req.query.modelUuid}'`
          )
        }
      }
      req.log.info({ versionId: version._id }, 'Created model version')

      const name = metadata.highLevelDetails.name
        .toLowerCase()
        .replace(/[^a-z 0-9]/g, '')
        .replace(/ /g, '-')

      let parentId
      if (req.body.parent) {
        req.log.info({ parent: req.body.parent }, 'Uploaded model has parent')
        const parentModel = await ModelModel.findOne({
          uuid: req.body.parent,
        })

        if (!parentModel) {
          throw BadReq(
            { parent: req.body.parent },
            `Unable to find parent with uuid: '${req.body.parent}'`
          )
        }

        parentId = parentModel._id
      }

      /** Saving the model **/

      let model: any = undefined

      if (mode === 'newVersion') {
        // Update an existing model's version array
        const modelUuid = req.query.modelUuid
        model = await ModelModel.findOne({ uuid: modelUuid })
        model.versions.push(version._id)
      } else {
        // Save a new model, and add the uploaded version to its array
        model = new ModelModel({
          schemaRef: metadata.schemaRef,
          uuid: `${name}-${nanoid()}`,

          parent: parentId,
          versions: [version._id],
          currentMetadata: metadata,

          owner: req.user?._id,
        })
      }

      await model.save()

      version.model = model._id
      await version.save()

      req.log.info({ modelId: model._id }, 'Created model document')

      const [managerRequest, reviewerRequest] = await createVersionRequests({ version: await version.populate('model') })
      req.log.info(
        { managerId: managerRequest._id, reviewRequest: reviewerRequest._id },
        'Successfully created requests for reviews'
      )

      const job = await uploadQueue
        .createJob({
          versionId: version._id,
          binary: normalizeMulterFile(files.binary[0]),
          code: normalizeMulterFile(files.code[0]),
        })
        .timeout(60000)
        .retries(2)
        .save()
      req.log.info({ jobId: job.id }, 'Successfully created job in upload queue')

      // then return reference to user
      res.json({
        uuid: model.uuid,
      })
    })
  },
]
