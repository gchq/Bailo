import * as Minio from 'minio'

import config from './config.js'
import logger from './logger.js'

export function getClient(): Minio.Client {
  return new Minio.Client(config.minio.connection)
}

export async function ensureBucketExists(bucket: string) {
  const client = getClient()

  let waitForMinio = true
  let exists = false
  while (waitForMinio) {
    try {
      exists = await client.bucketExists(bucket)
      waitForMinio = false
    } catch (e) {
      logger.error({ e }, 'Could not check bucket exists. Sleeping then trying again.')
      await new Promise((r) => {
        setTimeout(r, 1000)
      })
    }
  }
  if (!exists) {
    logger.info({ bucket }, 'Bucket does not exist, creating.')
    await client.makeBucket(bucket, config.minio.connection.region)
  }
}

export async function emptyBucket(bucket: string) {
  const client = getClient()

  logger.info({ bucket }, 'Listing items in bucket')
  const stream = client.listObjectsV2(bucket)

  const files: Array<Minio.BucketItem> = []
  stream.on('data', (obj) => files.push(obj))
  stream.on('error', (err) => logger.error({ error: err, bucket }, 'Error listing Minio files'))

  await new Promise((resolve) => {
    stream.on('close', resolve)
  })
  logger.info({ bucket }, 'Finished listing files in bucket')

  await client.removeObjects(
    bucket,
    files.map((file) => file.name).filter((item): item is string => !!item),
  )
  logger.info({ bucket }, 'Removed all files from bucket')
}

export async function copyFile(bucket: string, from: string, to: string) {
  const client = getClient()

  await client.copyObject(bucket, to, from, new Minio.CopyConditions())
}

export async function moveFile(bucket: string, from: string, to: string) {
  const client = getClient()

  await copyFile(bucket, from, to)
  await client.removeObject(bucket, from)
}
