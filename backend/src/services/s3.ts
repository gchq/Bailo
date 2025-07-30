import { Readable } from 'stream'

import { sign } from '../clients/kms.js'
import { getObjectStream, putObjectStream } from '../clients/s3.js'
import config from '../utils/config.js'
import log from './log.js'
import { ExportMetadata, generateDigest } from './mirroredModel.js'

export async function uploadToS3(
  fileName: string,
  stream: Readable,
  metadata: ExportMetadata,
  logData?: Record<string, unknown>,
) {
  const s3LogData = { ...metadata, ...logData }
  if (config.modelMirror.export.kmsSignature.enabled) {
    log.debug(logData, 'Using signatures. Uploading to temporary S3 location first.')
    uploadToTemporaryS3Location(fileName, stream, s3LogData).then(() =>
      copyToExportBucketWithSignatures(fileName, s3LogData, metadata).catch((error) =>
        log.error({ error, ...logData }, 'Failed to upload export to export location with signatures'),
      ),
    )
  } else {
    log.debug(logData, 'Signatures not enabled. Uploading to export S3 location.')
    uploadToExportS3Location(fileName, stream, s3LogData, metadata)
  }
}

async function copyToExportBucketWithSignatures(
  fileName: string,
  logData: Record<string, unknown>,
  metadata: ExportMetadata,
) {
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
  log.debug(logData, 'Successfully generated signatures')
  log.debug(logData, 'Getting stream from S3 to upload to export location.')
  const streamToCopy = await getObjectFromTemporaryS3Location(fileName, logData)
  await uploadToExportS3Location(fileName, streamToCopy, logData, {
    ...signatures,
    ...metadata,
  })
}

async function uploadToTemporaryS3Location(
  fileName: string,
  stream: Readable,
  logData: Record<string, unknown>,
  metadata?: Record<string, string>,
) {
  const bucket = config.s3.buckets.uploads
  const object = `exportQueue/${fileName}`
  try {
    await putObjectStream(object, stream, undefined, metadata)
    log.debug(
      {
        bucket,
        object,
        ...logData,
      },
      'Successfully uploaded export to temporary S3 location.',
    )
  } catch (error) {
    log.error(
      {
        bucket,
        object,
        error,
        ...logData,
      },
      'Failed to export to temporary S3 location.',
    )
  }
}

async function getObjectFromTemporaryS3Location(fileName: string, logData: Record<string, unknown>) {
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
    log.error(
      {
        bucket,
        object,
        error,
        ...logData,
      },
      'Failed to retrieve stream from temporary S3 location.',
    )
    throw error
  }
}

export async function getObjectFromExportS3Location(object: string, logData: Record<string, unknown>) {
  const bucket = config.modelMirror.export.bucket
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
    log.error(
      {
        bucket,
        object,
        error,
        ...logData,
      },
      'Failed to retrieve stream from temporary S3 location.',
    )
    throw error
  }
}

async function uploadToExportS3Location(
  object: string,
  stream: Readable,
  logData: Record<string, unknown>,
  metadata?: ExportMetadata,
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
  }
}
