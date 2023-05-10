import config from 'config'
import { Request, Response } from 'express'
import multer from 'multer'
import { customAlphabet } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from 'mongodb'
import { moveFile } from '../../utils/minio'
import { createFileRef } from '../../utils/multer'
import { createModel, findModelByUuid } from '../../services/model'
import { createVersionApprovals } from '../../services/approval'
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
import {
  upload,
  parseMetadata,
  getMetadataSchema,
  validateMetadata,
  checkZipFile,
  checkTarFile,
  checkSeldonVersion,
  handleMetadata,
  evaluateUploadType,
} from '../../utils/uploadExport'

export type MinioFile = Express.Multer.File & { bucket: string }
export interface MulterFiles {
  [fieldname: string]: Array<MinioFile>
}

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

export const postUpload = [
  ensureUserRole('user'),
  upload.fields([{ name: 'binary' }, { name: 'code' }, { name: 'docker' }]),
  async (req: Request, res: Response) => {
    const metadata = await handleMetadata(req.body.metadata)

    const files = req.files as unknown as MulterFiles

    const uploadType = metadata.buildOptions!.uploadType as ModelUploadType

    evaluateUploadType(uploadType, files, metadata)

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
      model = await findModelByUuid(req.user, modelUuid, { populate: true })
    } else {
      // Save a new model, and add the uploaded version to its array
      model = await createModel(req.user, {
        schemaRef: metadata.schemaRef,
        uuid: `${name}-${nanoid()}`,

        versions: [],
        // Temporarily set a new ObjectId to satisfy the type, then override below
        latestVersion: new ObjectId(),
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
    model.latestVersion = version._id

    await model.save()

    version.model = model._id
    await version.save()

    req.log.info({ code: 'created_model', model }, 'Created model document')

    const [managerApproval, reviewerApproval] = await createVersionApprovals({
      version: await version.populate('model').execPopulate(),
      user: req.user,
    })
    req.log.info(
      { code: 'created_review_approvals', managerId: managerApproval._id, reviewApproval: reviewerApproval._id },
      'Successfully created approvals for review'
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
