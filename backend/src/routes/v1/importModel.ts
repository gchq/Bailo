/* eslint-disable no-async-promise-executor */
import defaultAxios from 'axios'
import { Request, Response } from 'express'
import * as fs from 'fs'
import gunzip from 'gunzip-maybe'
import https from 'https'
import multer from 'multer'
import * as os from 'os'
import path from 'path'
import { Readable } from 'stream'
import * as tar from 'tar-stream'
import { v4 as uuidv4 } from 'uuid'

import { getUploadUrl, Layer, pushFile } from '../../utils/build/PushDockerTar.js'
import config from '../../utils/config.js'
import logger from '../../utils/logger.js'
import { getClient } from '../../utils/minio.js'
import MinioStore from '../../utils/MinioStore.js'
import { ContentTypes, ImageRef } from '../../utils/registry.js'
import { BadReq } from '../../utils/result.js'
import { ensureUserRole } from '../../utils/user.js'
import { getAccessToken } from './registryAuth.js'


export type MinioFile = Express.Multer.File & { bucket: string }
export interface MulterFiles {
  [fieldname: string]: Array<MinioFile>
}

const filename = uuidv4()
let metadata = {}
let schema = {}
let codePath: string
let binaryPath: string

const upload = multer({
  storage: new MinioStore({
    connection: config.minio.connection,
    bucket: () => config.minio.buckets.uploads,
    path: () => `/imports/models/${filename}`,
  }),
  limits: { fileSize: 34359738368 },
})

function parseMetadata(stringMetadata: string) {
  let mData

  try {
    mData = JSON.parse(stringMetadata)
  } catch (e) {
    throw BadReq({ code: 'metadata_invalid_json', mData: stringMetadata }, 'Metadata is not valid JSON')
  }

  return mData
}

export const importModel = [
  ensureUserRole('user'),
  upload.fields([{ name: 'model' }]),
  async (req: Request, res: Response) => {
    const files = req.files as unknown as Express.Multer.File

    const minio = getClient()
    const bucket = config.minio.buckets.uploads as string
    const minioFile = await minio.getObject(bucket, `/imports/models/${filename}`)

    let tempDir: string
    try {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'importModel'))
        logger.info(tempDir)
        let imageName = ''
        for(const file in files){
          const f = files[file]
          imageName = f[0]['originalname']
        }

        await streamFile(minioFile, bucket, tempDir, imageName)

    } catch (error) {
        logger.warn(error)
    } 

    return res.json({
      model: filename,
    })
  },
]

async function streamFile(minio: Readable, bucket: string, directory: fs.PathLike, image: string) {
  await new Promise<void>(async (resolve, reject) => {
    try {
      const extractMain = tar.extract()
      const extractImage = tar.extract()

      extractImage.on('entry', function (headers, stream, cb){
        if(headers.name.includes('manifest')){
          const outputStream = fs.createWriteStream(`${directory}/manifest.json`)
          stream.pipe(outputStream)
          outputStream.on('finish', () => {
            const manifestPath = `${directory}/manifest.json`
            logger.info(fs.existsSync(manifestPath) + ':' + headers.name)
          })
        } else if (headers.name.endsWith('.blob')) {
          const outputStream = fs.createWriteStream(`${directory}/${headers.name}`)
          stream.pipe(outputStream)
          outputStream.on('finish', () => {
            const blobPath = `${directory}/${headers.name}`
            logger.info(fs.existsSync(blobPath) + ':' + headers.name)
          })
        }

        stream.on('end', function() {
          cb()
        })

        stream.on('error', cb)

        stream.resume()
      })

      extractMain.on('entry', function (headers, stream, cb){
        if(headers.name.includes(image)){
          stream.pipe(gunzip()).pipe(extractImage)
        } else if (headers.name.includes('code.zip')) {
          const outputStream = fs.createWriteStream(`${directory}/code.zip`)
          stream.pipe(outputStream)
          outputStream.on('finish', () => {
            codePath = `${directory}/code.zip`
            logger.info(fs.existsSync(codePath) + ':code.zip')
          })
        } else if (headers.name.includes('binary.zip')) {
          const outputStream = fs.createWriteStream(`${directory}/binary.zip`)
          stream.pipe(outputStream)
          outputStream.on('finish', () => {
            binaryPath = `${directory}/binary.zip`
            logger.info(fs.existsSync(binaryPath) + ':binary.zip')
          })
        } else if (headers.name.includes('metadata.json')) {
          stream.on('data', function(chunk){
            metadata += chunk
          })
          logger.info(headers.name + ' pushed, Information: ' + metadata)
        } else if (headers.name.includes('schema.json')) {
          stream.on('data', function(chunk){
            schema += chunk
          })
          logger.info(headers.name + ' pushed, Information: ' + schema)
        }

        stream.on('end', function() {
          cb()
        })

        stream.on('error', cb)

        stream.resume()
      })

      extractMain.on('finish', function() {
        resolve()
      })

      minio.pipe(extractMain)

    } catch (error) {
      BadReq(error, 'Error Detected ' + error)
    }
  })

  // logger.info(`Removing ${directory}`)
  // await rm(directory, { recursive: true, force: true });

  logger.info('Time to Push Image')
  await pushImage(image, directory)
}

async function buildModel(){
  logger.info('Building Model')
  const mData = parseMetadata(metadata)
  metadata.timeStamp = new Date().toISOString()
  metadata.timeStamp = new Date().toISOString()
}

async function pushImage(i: string | any[], directory: fs.PathLike){
  await delay(4000) // Do not remove
  const registry = `${config.registry.connection.protocol}://${config.registry.connection.host}`
  const imageName = `internal/${i.slice(0, -4)}`
  const image: ImageRef = {
    namespace: 'internal',
    model: `${i.slice(0, -4)}`,
    version: 'v1.0',
  }

  const manifestString = fs.readFileSync(`${directory}/manifest.json`, 'utf-8')
  const manifest = JSON.parse(manifestString)

  const tag = 'v1.0'

  const rawBlobs: any[] = []
  const CHUNK_SIZE = 8 * 1024 * 1024

  for (const { blobSum } of manifest.fsLayers) {
    rawBlobs.push(`${blobSum.slice(7)}.blob`)
  }

  const blobs: any[] = rawBlobs.filter((elem, index, self) => index === self.indexOf(elem))

  logger.info(blobs)

  const token = await getAccessToken({ id: 'admin', _id: 'admin' }, [
    { type: 'repository', name: `${image.namespace}/${image.model}`, actions: ['pull', 'push'] },
  ])

  const authorisation = `Bearer ${token}`

  const axios = defaultAxios.create({
    maxBodyLength: CHUNK_SIZE,
    maxContentLength: CHUNK_SIZE,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      requestCert: true,
    }),
  })
  axios.defaults.headers.common.Authorization = authorisation

  const layers: Array<Layer> = []
  for (const layer of blobs) {
    const uploadUrl = await getUploadUrl(axios, registry, imageName)
    const { digest, size } = await pushFile(axios, registry, uploadUrl, `${directory}/${layer}`)
    layers.push({
      digest,
      size,
      mediaType: ContentTypes.APPLICATION_LAYER,
    })
  }

  const uploadUrl = await getUploadUrl(axios, registry, imageName)
  const { digest, size } = await pushFile(axios, registry, uploadUrl, `${directory}/manifest.json`)
  const manifestConfig: Layer = { digest, size, mediaType: ContentTypes.APPLICATION_CONFIG }

  const headers = {
    'Content-Type': ContentTypes.APPLICATION_MANIFEST,
  }
  const url = `${registry}/v2/${imageName}/manifests/${tag}`
  const registryManifest = {
    config: manifestConfig,
    layers,
    schemaVersion: 2,
    mediaType: ContentTypes.APPLICATION_MANIFEST,
  }

  await axios.put(url, registryManifest, { headers })
  logger.info({ imageName, tag }, `Finished pushing to ${imageName}:${tag}`)
  logger.info('Completed Finally!')
}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}