import { Readable } from 'node:stream'

import { sign } from '../../clients/kms.js'
import { getObjectStream, putObjectStream } from '../../clients/s3.js'
import { MirrorExportLogData, MirrorImportLogData } from '../../types/types.js'
import config from '../../utils/config.js'
import { InternalError } from '../../utils/error.js'
import log from '../log.js'
import { generateDigest } from './mirroredModel.js'

export async function uploadToS3(fileName: string, stream: Readable, logData: MirrorExportLogData) {
  if (config.modelMirror.export.kmsSignature.enabled) {
    log.debug(logData, 'Using signatures. Uploading to temporary S3 location first.')
    try {
      await uploadToTemporaryS3Location(fileName, stream, logData)
      await copyToExportBucketWithSignatures(fileName, logData)
    } catch (error) {
      log.error({ error, ...logData }, 'Failed to upload export to export location with signatures.')
    }
  } else {
    log.debug(logData, 'Signatures not enabled. Uploading to export S3 location.')
    try {
      await uploadToExportS3Location(fileName, stream, logData)
    } catch (error) {
      log.error({ error, ...logData }, 'Failed to upload export to export location without signatures.')
    }
  }
}

async function copyToExportBucketWithSignatures(fileName: string, logData: MirrorExportLogData) {
  let signatures = {}
  log.debug(logData, 'Getting stream from S3 to generate signatures.')
  const streamForDigest = await getObjectFromTemporaryS3Location(fileName, logData)
  const messageDigest = await generateDigest(streamForDigest)
  log.debug(logData, 'Generating signatures.')
  try {
    signatures = await sign(messageDigest)
  } catch (e) {
    log.error(logData, 'Error generating signature for export.')
    throw e
  }
  log.debug(logData, 'Successfully generated signatures.')
  log.debug(logData, 'Getting stream from S3 to upload to export location.')
  const streamToCopy = await getObjectFromTemporaryS3Location(fileName, logData)
  await uploadToExportS3Location(fileName, streamToCopy, logData, signatures)
}

async function uploadToTemporaryS3Location(fileName: string, stream: Readable, logData: MirrorExportLogData) {
  const bucket = config.s3.buckets.uploads
  const object = `exportQueue/${fileName}`
  try {
    await putObjectStream(object, stream)
    log.debug(
      {
        bucket,
        object,
        ...logData,
      },
      'Successfully uploaded export to temporary S3 location.',
    )
  } catch (error) {
    throw InternalError('Failed to export to temporary S3 location.', {
      bucket,
      object,
      error,
      ...logData,
    })
  }
}

async function getObjectFromTemporaryS3Location(fileName: string, logData: MirrorExportLogData) {
  const bucket = config.s3.buckets.uploads
  const object = `exportQueue/${fileName}`
  try {
    const stream = (await getObjectStream(object, bucket)).Body as Readable
    log.debug(
      {
        bucket,
        object,
        ...logData,
      },
      'Successfully retrieved stream from temporary S3 location.',
    )
    return stream
  } catch (error) {
    throw InternalError('Failed to retrieve stream from temporary S3 location.', {
      bucket,
      object,
      error,
      ...logData,
    })
  }
}

export async function getObjectFromExportS3Location(
  object: string,
  logData: MirrorExportLogData | MirrorImportLogData,
) {
  const bucket = config.modelMirror.export.bucket
  try {
    const stream = (await getObjectStream(object, bucket)).Body as Readable
    log.debug(
      {
        bucket,
        object,
        ...logData,
      },
      'Successfully retrieved stream from export S3 location.',
    )
    return stream
  } catch (error) {
    log.error(
      {
        bucket,
        object,
        error,
        ...logData,
      },
      'Failed to retrieve stream from export S3 location.',
    )
    throw error
  }
}

async function uploadToExportS3Location(
  object: string,
  stream: Readable,
  logData: MirrorExportLogData,
  metadata?: Record<string, string>,
) {
  const bucket = config.modelMirror.export.bucket
  try {
    await putObjectStream(object, stream, bucket, metadata)
    log.debug(
      {
        bucket,
        object,
        ...logData,
      },
      'Successfully uploaded export to export S3 location.',
    )
  } catch (error) {
    log.error(
      {
        bucket,
        object,
        error,
        ...logData,
      },
      'Failed to export to export S3 location.',
    )
    throw InternalError('Failed to export to export S3 location.', {
      bucket,
      object,
      error,
      ...logData,
    })
  }
}
