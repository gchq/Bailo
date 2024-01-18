import { describe, expect, test, vi } from 'vitest'

import { getObjectStream, headObject } from '../../src/clients/s3.js'

const s3Mocks = vi.hoisted(() => {
  const send = vi.fn(() => 'response')

  return {
    send,
    GetObjectCommand: vi.fn(() => ({})),
    S3Client: vi.fn(() => ({ send })),
  }
})
vi.mock('@aws-sdk/client-s3', () => s3Mocks)

describe('clients > s3', () => {
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

  test('headObject > success', async () => {
    const bucket = 'test-bucket'
    const key = 'test-key'

    const response = await headObject(bucket, key)

    expect(s3Mocks.GetObjectCommand).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: key,
    })
    expect(s3Mocks.send).toHaveBeenCalled()
    expect(response).toBe('response')
  })
})
