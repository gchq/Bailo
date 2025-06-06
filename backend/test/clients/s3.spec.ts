import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import { ensureBucketExists, getObjectStream, objectExists, putObjectStream } from '../../src/clients/s3.js'

const s3Mocks = vi.hoisted(() => {
  const send = vi.fn(() => 'response')

  return {
    send,
    GetObjectCommand: vi.fn(() => ({})),
    HeadObjectCommand: vi.fn(() => ({})),
    HeadBucketCommand: vi.fn(() => ({})),
    CreateBucketCommand: vi.fn(() => ({})),
    S3Client: vi.fn(() => ({ send })),
  }
})
vi.mock('@aws-sdk/client-s3', () => s3Mocks)

const s3UploadMocks = vi.hoisted(() => {
  return {
    Upload: vi.fn(() => ({ on: vi.fn(), done: vi.fn() })),
  }
})
vi.mock('@aws-sdk/lib-storage', () => s3UploadMocks)

describe('clients > s3', () => {
  test('putObjectStream > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const body = new Readable()

    await putObjectStream(bucket, key, body)

    expect(s3UploadMocks.Upload).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          Bucket: bucket,
          Key: key,
          Body: body,
        },
      }),
    )
    expect(s3UploadMocks.Upload).toHaveBeenCalled()
  })

  test('putObjectStream > error', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const body = new Readable()
    s3UploadMocks.Upload.mockRejectedValueOnce('Error')

    const response = putObjectStream(bucket, key, body)

    await expect(response).rejects.toThrowError('Unable to upload the object to the S3 service.')
  })

  test('getObjectStream > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const range = { start: 0, end: 100 }

    const response = await getObjectStream(bucket, key, range)

    expect(s3Mocks.GetObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
      Range: `bytes=${range.start}-${range.end}`,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toBe('response')
  })

  test('getObjectStream > error', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const range = { start: 0, end: 100 }
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 404 } })

    const response = getObjectStream(bucket, key, range)

    await expect(response).rejects.toThrowError('Unable to retrieve the object from the S3 service.')
  })

  test('objectExists > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'

    const response = await objectExists(bucket, key)

    expect(s3Mocks.HeadObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toBe(true)
  })

  test('objectExists > no object', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 404 } })

    const response = await objectExists(bucket, key)

    expect(s3Mocks.HeadObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toBe(false)
  })

  test('objectExists > error', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 500 } })

    const response = objectExists(bucket, key)

    await expect(response).rejects.toThrowError('Unable to get object metadata from the S3 service.')
  })

  test('ensureBucketExists > create new bucket', async () => {
    const bucket = 'test-bucket'
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 404 } })

    const response = await ensureBucketExists(bucket)

    expect(s3Mocks.HeadBucketCommand).toHaveBeenCalledWith({
      Bucket: bucket,
    })
    expect(s3Mocks.HeadBucketCommand).toHaveBeenCalledWith({
      Bucket: bucket,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toBe('response')
  })

  test('ensureBucketExists > head bucket error', async () => {
    const bucket = 'test-bucket'
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 500 } })

    const response = ensureBucketExists(bucket)

    await expect(response).rejects.toThrowError('There was a problem ensuring this bucket exists.')
  })

  test('ensureBucketExists > create bucket error', async () => {
    const bucket = 'test-bucket'
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 404 } })
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 500 } })

    const response = ensureBucketExists(bucket)

    await expect(response).rejects.toThrowError('Unable to create a new bucket.')
  })
})
