import {
  CreateBucketCommand,
  CreateBucketRequest,
  GetObjectCommand,
  GetObjectRequest,
  HeadBucketCommand,
  HeadBucketRequest,
  HeadObjectRequest,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import prettyBytes from 'pretty-bytes'
import { PassThrough, Readable } from 'stream'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'

export async function getS3Client() {
  return new S3Client({
    ...(config.s3.credentials.accessKeyId &&
      config.s3.credentials.secretAccessKey && { credentials: { ...config.s3.credentials } }),
    endpoint: config.s3.endpoint,
    region: config.s3.region,
    forcePathStyle: config.s3.forcePathStyle,
    requestHandler: new NodeHttpHandler({
      httpsAgent: getHttpsAgent({ rejectUnauthorized: config.s3.rejectUnauthorized }),
    }),
  })
}

export async function putObjectStream(
  bucket: string,
  key: string,
  body: PassThrough | Readable,
  metadata?: Record<string, string>,
) {
  const upload = new Upload({
    client: await getS3Client(),
    params: { Bucket: bucket, Key: key, Body: body, Metadata: metadata },
    queueSize: 4,
    partSize: 1024 * 1024 * 64,
    leavePartsOnError: false,
  })

  let fileSize = 0
  upload.on('httpUploadProgress', (progress) => {
    log.debug(
      {
        ...progress,
        ...(progress.loaded && { loaded: prettyBytes(progress.loaded), loadedBytes: progress.loaded }),
        ...(progress.total && { total: prettyBytes(progress.total), totalBytes: progress.total }),
      },
      'Object upload is in progress',
    )
    if (progress.loaded) {
      fileSize = progress.loaded
    }
  })

  const s3Response = await upload.done()
  log.debug(s3Response, 'Object upload complete')

  return {
    fileSize,
  }
}

export async function getObjectStream(bucket: string, key: string, range?: { start: number; end: number }) {
  const client = await getS3Client()

  const input: GetObjectRequest = {
    Bucket: bucket,
    Key: key,
  }

  if (range) {
    input.Range = `bytes=${range.start}-${range.end}`
  }

  const command = new GetObjectCommand(input)
  const response = await client.send(command)

  return response
}

export async function headObject(bucket: string, key: string) {
  const client = await getS3Client()

  const input: HeadObjectRequest = {
    Bucket: bucket,
    Key: key,
  }

  const command = new GetObjectCommand(input)
  const response = await client.send(command)

  return response
}

export async function objectExists(bucket: string, key: string) {
  try {
    log.info({ bucket, key }, `Searching for ${key} in ${bucket}`)
    await headObject(bucket, key)
    return true
  } catch (error) {
    if (isS3ServiceException(error) && error.$metadata.httpStatusCode === 404) {
      log.info({ bucket, key }, `Failed to find ${key} in ${bucket}`)
      return false
    } else {
      throw error
    }
  }
}

export async function headBucket(bucket: string) {
  const client = await getS3Client()

  const input: HeadBucketRequest = {
    Bucket: bucket,
  }

  const command = new HeadBucketCommand(input)
  const response = await client.send(command)

  return response
}

export async function createBucket(bucket: string) {
  const client = await getS3Client()

  const input: CreateBucketRequest = {
    Bucket: bucket,
  }

  const command = new CreateBucketCommand(input)
  const response = await client.send(command)

  return response
}

export async function ensureBucketExists(bucket: string) {
  try {
    log.info({ bucket }, `Ensuring ${bucket} exists`)
    await headBucket(bucket)
    log.info({ bucket }, `Bucket ${bucket} already exists`)
  } catch (error) {
    if (isS3ServiceException(error) && error.$metadata.httpStatusCode === 404) {
      log.info({ bucket }, `Bucket does not exist, creating ${bucket}`)
      return createBucket(bucket)
    }
    throw error
  }
}

const isS3ServiceException = (value: unknown): value is S3ServiceException => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!('name' in value) || !('message' in value) || !('$fault' in value) || !('$metadata' in value)) {
    return false
  }
  return true
}
