import { Request, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4, version } from 'uuid'
import https from 'https'
import defaultAxios from 'axios'
import * as fs from 'fs'
import { FileRef } from '../../utils/build/build.js'
import { MinioRandomAccessReader, getFileStream, listZipFiles } from '../../utils/zip.js'
import { log } from 'console'
import config from '../../utils/config.js'
import { ContentTypes, ImageRef } from '../../utils/registry.js'
import { Layer, getUploadUrl, pushFile } from '../../utils/build/PushDockerTar.js'
import { Stream } from 'stream'
import path from 'path'
import { getClient } from '../../utils/minio.js'
import MinioStore from '../../utils/MinioStore.js'
import { BadReq } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'
import logger from '../../utils/logger.js'
import { getAccessToken } from './registryAuth.js'

export type MinioFile = Express.Multer.File & { bucket: string }
export interface MulterFiles {
    [fieldname: string]: Array<MinioFile>
}

const filename = uuidv4()

const upload = multer({
    storage: new MinioStore({
        connection: config.minio.connection,
        bucket: () => config.minio.buckets.uploads,
        path: () => `/imports/models/${filename}`,
    }),
    limits: { fileSize: 34359738368 },
}) // Do same thing for Import

export const importModel = [
    ensureUserRole('user'),
    upload.fields([{ name: 'model' }]),
    async (req: Request, res: Response) => {
        const files = req.files as unknown as Express.Multer.File

        // const registry = `${config.get('registry.protocol')}://${config.get('registry.host')}`
        // const imageName = `internal/${files.filename}`
        // const image: ImageRef = {
        //   namespace: 'internal',
        //   model: `${files.filename}`,
        //   version: 'v1.0',
        // }

        const minio = getClient()
        const bucket = config.minio.buckets.uploads as string

        minio.putObject(bucket, filename, files.buffer)

        const dir = './importModel'
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }
        } catch (err) {
            logger.error(err)
        }

        const fileRef: FileRef = {
            bucket: config.minio.buckets.uploads,
            path: `/model/imports/${filename}`,
            name: filename,
        }

        // List all contents stored in the zip archive
        minio.listObjectsV2(bucket, `/model/imports/${filename}`).on('build', (request) => {
            request.httpRequest.headers['X-Minio-Extract'] = 'true'
        })

        const file = fs.createWriteStream(`${dir}/manifest`)
            ; (await minio.getObject(bucket, `/model/imports/${filename}/manifest`))
                .on('build', (request) => {
                    request.httpRequest.headers['X-Minio-Extract'] = 'true'
                })
                .on('httpData', (chunk) => {
                    file.write(chunk)
                })
                .on('httpDone', () => {
                    file.end()
                })

        return res.json({
            model: filename,
        })

        //Upload all manifests and blob to docker


        const metadata = // minio get metadata file
        const schemaRef = // minio get schema file
        const code = // path to code file (local)
        const binary = // path to binary file (local)
    },
]