import {
  CreateBucketCommand,
  CreateBucketRequest,
  GetObjectCommand,
  GetObjectRequest,
  HeadBucketCommand,
  HeadBucketRequest,
  HeadObjectRequest,
  NoSuchKey,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { PassThrough } from 'stream'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'

export async function getS3Client() {
  return new S3Client({
    credentials: config.s3.credentials,
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
  body: ReadableStream | PassThrough,
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
    log.debug('Object upload is in progress', progress)
    if (progress.loaded) {
      fileSize = progress.loaded
    }
  })

  const s3Response = await upload.done()
  log.debug('Object upload complete', s3Response)

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
    if ((error as any)['$metadata'].httpStatusCode === 404) {
      log.info({ bucket }, `Bucket does not exist, creating ${bucket}`)
      return createBucket(bucket)
    }
    throw error
  }
}

export function isNoSuchKeyException(err: any): err is NoSuchKey {
  return err?.name === 'NoSuchKey'
}
