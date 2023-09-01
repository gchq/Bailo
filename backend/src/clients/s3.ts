import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

import config from '../utils/v2/config.js'

export async function getS3Client() {
  const client = new S3Client(config.s3)

  return client
}

export async function putObjectStream(bucket: string, key: string, body: ReadableStream) {
  const upload = new Upload({
    client: await getS3Client(),
    params: { Bucket: bucket, Key: key, Body: body },
    queueSize: 4,
    partSize: 1024 * 1024 * 64,
    leavePartsOnError: false,
  })

  upload.on('httpUploadProgress', (progress) => {
    console.log(progress)
  })

  await upload.done()
}
