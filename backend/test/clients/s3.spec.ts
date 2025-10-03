import { Readable } from 'node:stream'

import { describe, expect, test, vi } from 'vitest'

import {
  completeMultipartUpload,
  createPresignedUploadUrl,
  ensureBucketExists,
  getObjectStream,
  headObject,
  objectExists,
  putObjectStream,
  startMultipartUpload,
} from '../../src/clients/s3.js'

const s3Mocks = vi.hoisted(() => {
  const send = vi.fn(() => 'response')

  return {
    send,
    GetObjectCommand: vi.fn(() => ({})),
    HeadObjectCommand: vi.fn(() => ({})),
    HeadBucketCommand: vi.fn(() => ({})),
    CreateBucketCommand: vi.fn(() => ({})),
    CreateMultipartUploadCommand: vi.fn(() => ({})),
    CompleteMultipartUploadCommand: vi.fn(() => ({})),
    UploadPartCommand: vi.fn(() => ({})),
    S3Client: vi.fn(() => ({ send })),
  }
})
vi.mock('@aws-sdk/client-s3', () => s3Mocks)

const s3RequestPresignerMocks = vi.hoisted(() => ({
  getSignedUrl: vi.fn(() => 'https://test.com/presigned/url'),
}))
vi.mock('@aws-sdk/s3-request-presigner', () => s3RequestPresignerMocks)

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

    await putObjectStream(key, body, bucket)

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

    const response = putObjectStream(key, body, bucket)

    await expect(response).rejects.toThrowError('Unable to upload the object to the S3 service.')
  })

  test('getObjectStream > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const range = { start: 0, end: 100 }

    const response = await getObjectStream(key, bucket, range)

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

  test('startMultipartUpload > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const contentType = 'application/octet-stream'

    const response = await startMultipartUpload(key, contentType, bucket)

    expect(s3Mocks.CreateMultipartUploadCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toEqual({ uploadId: undefined })
  })

  test('startMultipartUpload > error', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const contentType = 'application/octet-stream'
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 404 } })

    const response = startMultipartUpload(key, contentType, bucket)

    await expect(response).rejects.toThrowError()
  })

  test('createPresignedUploadUrl > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const uploadId = 'test-upload-id'
    const partNumber = 1

    const response = await createPresignedUploadUrl(key, uploadId, partNumber, bucket)

    expect(s3Mocks.UploadPartCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })
    expect(s3RequestPresignerMocks.getSignedUrl).toHaveBeenCalled()
    expect(response).toEqual('https://test.com/presigned/url')
  })

  test('createPresignedUploadUrl > error', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const uploadId = 'test-upload-id'
    const partNumber = 1
    s3RequestPresignerMocks.getSignedUrl.mockRejectedValueOnce({
      name: '',
      message: '',
      $fault: {},
      $metadata: { httpStatusCode: 404 },
    })

    const response = createPresignedUploadUrl(key, uploadId, partNumber, bucket)

    await expect(response).rejects.toThrowError()
  })

  test('completeMultipartUpload > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const uploadId = 'test-upload-id'
    const parts = [
      { ETag: '0123456789abcdef', PartNumber: 1 },
      { ETag: 'fedcba9876543210', PartNumber: 2 },
    ]

    const response = await completeMultipartUpload(key, uploadId, parts, bucket)

    expect(s3Mocks.CompleteMultipartUploadCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toEqual('response')
  })

  test('completeMultipartUpload > error', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    const uploadId = 'test-upload-id'
    const parts = [
      { ETag: '0123456789abcdef', PartNumber: 1 },
      { ETag: 'fedcba9876543210', PartNumber: 2 },
    ]
    s3Mocks.send.mockRejectedValueOnce({
      name: '',
      message: '',
      $fault: {},
      $metadata: { httpStatusCode: 404 },
    })

    const response = completeMultipartUpload(key, uploadId, parts, bucket)

    await expect(response).rejects.toThrowError()
  })

  test('objectExists > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'

    const response = await objectExists(key, bucket)

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

    const response = await objectExists(key, bucket)

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

    const response = objectExists(key, bucket)

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

  test('headObject > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'

    const response = await headObject(key, bucket)

    expect(s3Mocks.HeadObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toEqual('response')
  })

  test('headObject > no object', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'
    s3Mocks.send.mockRejectedValueOnce({ name: '', message: '', $fault: {}, $metadata: { httpStatusCode: 404 } })

    const response = headObject(key, bucket)

    await expect(response).rejects.toThrowError()
    expect(s3Mocks.HeadObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
  })
})
