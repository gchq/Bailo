import { GetObjectCommand, GetObjectRequest, S3Client } from '@aws-sdk/client-s3'
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

  let fileSize = 0
  upload.on('httpUploadProgress', (progress) => {
    if (progress.loaded) {
      fileSize = progress.loaded
    }
  })

  await upload.done()

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
