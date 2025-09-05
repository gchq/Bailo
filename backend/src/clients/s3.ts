import {
  CompleteMultipartUploadCommand,
  CreateBucketCommand,
  CreateBucketRequest,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  GetObjectRequest,
  HeadBucketCommand,
  HeadBucketRequest,
  HeadObjectCommand,
  HeadObjectRequest,
  S3Client,
  S3ServiceException,
  UploadPartCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import prettyBytes from 'pretty-bytes'
import { PassThrough, Readable } from 'stream'

import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import { isBailoError } from '../types/error.js'
import config from '../utils/config.js'
import { InternalError } from '../utils/error.js'

async function getS3Client() {
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
  key: string,
  body: PassThrough | Readable,
  bucket: string = config.s3.buckets.uploads,
  metadata?: Record<string, string>,
) {
  try {
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
  } catch (error) {
    throw InternalError('Unable to upload the object to the S3 service.', {
      internal: { error, bucket, key, metadata },
    })
  }
}

export async function getObjectStream(
  key: string,
  bucket: string = config.s3.buckets.uploads,
  range?: { start: number; end: number },
) {
  const client = await getS3Client()

  const input: GetObjectRequest = {
    Bucket: bucket,
    Key: key,
  }

  if (range) {
    input.Range = `bytes=${range.start}-${range.end}`
  }

  try {
    const command = new GetObjectCommand(input)
    const response = await client.send(command)
    return response
  } catch (error) {
    throw InternalError('Unable to retrieve the object from the S3 service.', {
      internal: { error, bucket, key, range },
    })
  }
}

export async function startMultipartUpload(
  key: string,
  contentType: string,
  bucket: string = config.s3.buckets.uploads,
) {
  const client = await getS3Client()
  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })
  const result = await client.send(command)
  return { uploadId: result.UploadId }
}

export async function createPresignedUploadUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  bucket: string = config.s3.buckets.uploads,
) {
  const client = await getS3Client()
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })
  return getSignedUrl(client, command, { expiresIn: 3600 })
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ ETag: string; PartNumber: number }>,
  bucket: string = config.s3.buckets.uploads,
) {
  const client = await getS3Client()
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  })
  return client.send(command)
}

export async function objectExists(key: string, bucket: string = config.s3.buckets.uploads) {
  try {
    log.info({ bucket, key }, `Searching for ${key} in ${bucket}`)
    await headObject(key, bucket)
    return true
  } catch (error) {
    if (isS3ServiceException(error) && error.$metadata.httpStatusCode === 404) {
      log.info({ bucket, key }, `Failed to find ${key} in ${bucket}`)
      return false
    } else {
      throw InternalError('Unable to get object metadata from the S3 service.', { error, bucket, key })
    }
  }
}

export async function ensureBucketExists(bucket: string) {
  try {
    log.info({ bucket }, `Ensuring ${bucket} exists`)
    await headBucket(bucket)
    log.info({ bucket }, `Bucket ${bucket} already exists`)
  } catch (error) {
    if (
      isBailoError(error) &&
      isS3ServiceException(error.context?.error) &&
      error.context.error.$metadata.httpStatusCode === 404
    ) {
      log.info({ bucket }, `Bucket does not exist, creating ${bucket}`)
      return createBucket(bucket)
    }
    throw InternalError('There was a problem ensuring this bucket exists.', { internal: { error } })
  }
}

export async function headObject(key: string, bucket: string = config.s3.buckets.uploads) {
  const client = await getS3Client()

  const input: HeadObjectRequest = {
    Bucket: bucket,
    Key: key,
  }

  const command = new HeadObjectCommand(input)
  const response = await client.send(command)
  return response
}

async function headBucket(bucket: string) {
  const client = await getS3Client()

  const input: HeadBucketRequest = {
    Bucket: bucket,
  }

  try {
    const command = new HeadBucketCommand(input)
    const response = await client.send(command)
    return response
  } catch (error) {
    throw InternalError('Unable to retrieve bucket metadata from the S3 service.', { error, bucket })
  }
}

async function createBucket(bucket: string) {
  const client = await getS3Client()

  const input: CreateBucketRequest = {
    Bucket: bucket,
  }

  try {
    const command = new CreateBucketCommand(input)
    const response = await client.send(command)
    return response
  } catch (error) {
    throw InternalError('Unable to create a new bucket.', { error, bucket })
  }
}

function isS3ServiceException(value: unknown): value is S3ServiceException {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!('name' in value) || !('message' in value) || !('$fault' in value) || !('$metadata' in value)) {
    return false
  }
  return true
}
