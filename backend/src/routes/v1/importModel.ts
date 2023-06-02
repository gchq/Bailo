/* eslint-disable no-async-promise-executor */
import { Request, Response } from 'express'
import { Types } from 'mongoose'
import multer from 'multer'
import { customAlphabet } from 'nanoid'
import { Stream } from 'stream'
import { v4 as uuidv4 } from 'uuid'

import VersionModel from '../../models/Version.js'
import { createVersionApprovals } from '../../services/approval.js'
import { createModel, findModelByUuid } from '../../services/model.js'
import { createSchema, findSchemaByRef } from '../../services/schema.js'
import { createVersion } from '../../services/version.js'
import { MinimalEntry } from '../../types/types.js'
import config from '../../utils/config.js'
import logger from '../../utils/logger.js'
import { getClient } from '../../utils/minio.js'
import MinioStore from '../../utils/MinioStore.js'
import { createFileRef } from '../../utils/multer.js'
import { getUploadQueue } from '../../utils/queues.js'
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

const minio = getClient()

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
    // Default set all contacts to uploading user
    versionJson.metadata.contacts.uploader = [{
        "kind": "user",
        "id": req.user.id
    }]
    versionJson.metadata.contacts.reviewer = [{
        "kind": "user",
        "id": req.user.id
    }]
    versionJson.metadata.contacts.manager = [{
        "kind": "user",
        "id": req.user.id
    }]
    const versionSchemaRef = versionJson.metadata.schemaRef
    let schema = await findSchemaByRef(versionSchemaRef)

    // Check if schema exists in BAILO instance and create one if it doesn't
    if(!schema){
        const schemaJson = await streamFileToJSON(fileRef, 'model_schema.json')
        schema = await createSchema(schemaJson)
    }
    
    // Check if Model already exists in BAILO instance
    let model = await findModelByUuid(req.user, versionJson.uuid)

    // If model does not exist, create a new basic model with the specified UUID from the import file
    if (!model) {
        model = await createModel(req.user, {
            schemaRef: schema.reference,
            uuid: versionJson.uuid,
            versions: new Types.Array(),
            latestVersion: new Types.ObjectId(),
        })
    }

    // Create a new version to attach to the model
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

    // Attach new version to model and set as latest version
    model.versions.push(version._id)
    model.latestVersion = version._id

    // Save model with these changes
    await model.save()
    req.log.info({ code: 'created_model', model }, 'Created model document')

    // Set approvals for newly imported model
    const [managerApproval, reviewerApproval] = await createVersionApprovals({
        version: await version.populate('model'),
        user: req.user,
      })
      req.log.info(
        { code: 'created_review_approvals', managerId: managerApproval._id, reviewApproval: reviewerApproval._id },
        'Successfully created approvals for review'
    )
    const codeFileName = `model/${model._id}/version/${version._id}/raw/code/${uuidv4()}`
    const binaryFileName = `model/${model._id}/version/${version._id}/raw/binary/${uuidv4()}`
    
    // Upload Code file to Minio if it exists
    const codeFile = await streamFileFromMinio(fileRef, 'code.zip')
    if (codeFile) {
        minio.putObject(config.minio.buckets.uploads, codeFileName, codeFile.fileStream, codeFile.fileReference.uncompressedSize)
        
    }
    
    // Upload Binary file to Minio if it exists
    const binaryFile = await streamFileFromMinio(fileRef, 'binary.zip')
    if (binaryFile) {
        minio.putObject(config.minio.buckets.uploads, binaryFileName, binaryFile.fileStream, binaryFile.fileReference.uncompressedSize)
    }
    
    
    if(codeFile && binaryFile) {
        await VersionModel.findOneAndUpdate({ _id: version._id}, { files : { rawBinaryPath: binaryFileName, rawCodePath: codeFileName}})
        req.log.info(
            { code: 'adding_file_paths', binaryFileName},
            'Adding Binary path to exports of files to version'
        )
        await version.save()
    }

    // Upload Docker file to Registry

    return res.json({
      model
    })
  },
]

async function streamFileToJSON(fileRef: {bucket: string, path: string, name: string}, documentName: string) {
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

async function streamFileFromMinio(fileRef: {bucket: string, path: string, name: string}, fileName: string) {
    const reader = new MinioRandomAccessReader(minio,fileRef)

    const fileList: Array<MinimalEntry> = await listZipFiles(reader)

    const fileEntry: MinimalEntry | undefined = fileList.find((file) => file.fileName === fileName)

    if (!fileEntry) {
        return undefined
    }

    const fileStream = await getFileStream(reader, fileEntry)

    return {fileReference: fileEntry, fileStream}
}


async function pushDockerFiles(){
  // TODO: Add function to push docker files to registry
}