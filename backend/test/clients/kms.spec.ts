import { describe, expect, test, vi } from 'vitest'

import { sign } from '../../src/clients/kms.js'

const kmsMocks = vi.hoisted(() => {
  const send = vi.fn()

  return {
    send,
    DescribeKeyCommand: vi.fn(() => ({})),
    SignCommand: vi.fn(() => ({})),
    KMSClient: vi.fn(() => ({ send })),
  }
})
vi.mock('@aws-sdk/client-kms', () => kmsMocks)

const configMock = vi.hoisted(
  () =>
    ({
      modelMirror: {
        export: {
          maxSize: 100,
          kmsSignature: {
            keyId: '123-456',
            KMSClient: {
              region: 'eu-west-2',
              credentials: {
                accessKeyId: 'access',
                secretAccessKey: 'secret',
              },
            },
          },
        },
      },
    }) as any,
)
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('clients > s3', () => {
  test('sign > success', async () => {
    kmsMocks.send.mockResolvedValueOnce({
      KeyMetadata: {
        SigningAlgorithms: ['abc'],
      },
    })
    kmsMocks.send.mockResolvedValueOnce({
      Signature: 'abcefgh',
    })

    await sign('hash123')

    expect(kmsMocks.DescribeKeyCommand).toHaveBeenCalledWith({
      KeyId: configMock.modelMirror.export.kmsSignature.keyId,
    })
    expect(kmsMocks.send).toHaveBeenCalled()
  })

  test('sign > cannot get key information', async () => {
    kmsMocks.send.mockResolvedValueOnce({})
    kmsMocks.send.mockResolvedValueOnce({
      Signature: 'abcefgh',
    })

    const response = sign('hash123')

    expect(kmsMocks.DescribeKeyCommand).toHaveBeenCalledWith({
      KeyId: configMock.modelMirror.export.kmsSignature.keyId,
    })
    await expect(response).rejects.toThrowError(/^Cannot get key information./)
  })

  test('sign > cannot get signature', async () => {
    kmsMocks.send.mockResolvedValueOnce({
      KeyMetadata: {
        SigningAlgorithms: ['abc'],
      },
    })
    kmsMocks.send.mockResolvedValueOnce({})

    const response = sign('hash123')

    expect(kmsMocks.DescribeKeyCommand).toHaveBeenCalledWith({
      KeyId: configMock.modelMirror.export.kmsSignature.keyId,
    })
    await expect(response).rejects.toThrowError(/^Cannot get signature./)
  })
})
