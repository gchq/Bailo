/* eslint-disable no-async-promise-executor */
import { Request, Response } from 'express'
import { Types } from 'mongoose'
import multer from 'multer'
import { Stream } from 'stream'
import { v4 as uuidv4 } from 'uuid'

import { createVersionApprovals } from '../../services/approval.js'
import { createModel, findModelByUuid } from '../../services/model.js'
import { createSchema, findSchemaByRef } from '../../services/schema.js'
import { createVersion } from '../../services/version.js'
import { MinimalEntry } from '../../types/types.js'
import config from '../../utils/config.js'
import logger from '../../utils/logger.js'
import { getClient } from '../../utils/minio.js'
import MinioStore from '../../utils/MinioStore.js'
import { BadReq, Conflict } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'
import { getFileStream, listZipFiles, MinioRandomAccessReader } from '../../utils/zip.js'
import { MulterFiles } from './upload.js'

const upload = multer({
  storage: new MinioStore({
    connection: config.minio.connection,
    bucket: () => config.minio.buckets.uploads,
    path: () => `/imports/models/${uuidv4()}`,
  }),
  limits: { fileSize: 34359738368 },
})

async function streamToBuffer( stream: Stream): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const _buf = Array<any>()

        stream.on('data', chunk => _buf.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(_buf)))
        stream.on('error', err => reject(`error converting stream - ${err}`))
    })
}

export const importModel = [
  ensureUserRole('user'),
  upload.fields([{ name: 'model' }]),
  async (req: Request, res: Response) => {
    const files = req.files as unknown as MulterFiles

    const fileRef = {
        bucket: files.model[0].bucket,
        path: files.model[0].path,
        name: files.model[0].originalname
    }
    
    const versionJson = await streamFileToJSON(fileRef,'version.json')
    const versionSchemaRef = versionJson.metadata.schemaRef
    let schema = await findSchemaByRef(versionSchemaRef)

    if(!schema){
        const schemaJson = await streamFileToJSON(fileRef, 'model_schema.json')
        schema = await createSchema(schemaJson)
    }
    

    let model = await findModelByUuid(req.user, versionJson.uuid)

    if (!model) {
        // TODO: Create new model
        model = await createModel(req.user, {
            schemaRef: schema.reference,
            uuid: versionJson.uuid,
            versions: new Types.Array(),
            latestVersion: new Types.ObjectId(),
        })
    }

    let version
    try {
        version = await createVersion(req.user, {
          version: versionJson.metadata.highLevelDetails.modelCardVersion,
          model: model._id,
          metadata: versionJson.metadata,
          files: {},
        })
      } catch (err: any) {
        if (err.code === 11000) {
          throw Conflict(
            {
              version: versionJson.metadata.highLevelDetails.modelCardVersion,
              model: versionJson.uuid,
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

    req.log.info({ code: 'created_model', model }, 'Created model document')

    const [managerApproval, reviewerApproval] = await createVersionApprovals({
        version: await version.populate('model'),
        user: req.user,
      })
      req.log.info(
        { code: 'created_review_approvals', managerId: managerApproval._id, reviewApproval: reviewerApproval._id },
        'Successfully created approvals for review'
    )



    return res.json({
      model: versionJson,
    })
  },
]

async function streamFileToJSON(fileRef: {bucket: string, path: string, name: string}, documentName: string) {
    const minio = getClient()
    const reader = new MinioRandomAccessReader(minio,fileRef)

    const fileList: Array<MinimalEntry> = await listZipFiles(reader)

    const documentRef: MinimalEntry | undefined = fileList.find((file) => file.fileName === documentName)

    if (!documentRef) {
        throw BadReq({documentName},`No document found in ${fileRef.name} that matches ${documentName}`)
    }

    const documentText = await (await streamToBuffer( await getFileStream(reader, documentRef))).toString('utf-8')
    const document = JSON.parse(documentText)

    return document
}


async function pushDockerFiles(){
  // TODO: Add function to push docker files to registry
}