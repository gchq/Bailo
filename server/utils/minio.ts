import * as Minio from 'minio'
import config from 'config'
import logger from './logger'

export function getClient(): Minio.Client {
  return new Minio.Client(config.get('minio'))
}

export async function ensureBucketExists(bucket: string) {
  const client = new Minio.Client(config.get('minio'))
  const exists = await client.bucketExists(bucket)

  if (!exists) {
    logger.info({ bucket }, 'Bucket does not exist, creating.')
    await client.makeBucket(bucket, (config.get('minio') as any).region)
  }
}

export async function emptyBucket(bucket: string) {
  const client = getClient()

  logger.info({ bucket }, 'Listing items in bucket')
  const stream = client.listObjectsV2(bucket)

  const files: Array<Minio.BucketItem> = []
  stream.on('data', function (obj) {
    files.push(obj)
  })
  stream.on('error', function (err) {
    logger.error({ error: err, bucket }, 'Error listing Minio files')
  })

  await new Promise((resolve) => stream.on('close', resolve))
  logger.info({ bucket }, 'Finished listing files in bucket')

  await client.removeObjects(
    bucket,
    files.map((file) => file.name)
  )
  logger.info({ bucket }, 'Removed all files from bucket')
}
