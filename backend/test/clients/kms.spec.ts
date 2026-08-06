import { describe, expect, test, vi } from 'vitest'

import { sign } from '../../src/clients/kms.js'

const kmsMocks = vi.hoisted(() => {
  const send = vi.fn()

  return {
    send,
    DescribeKeyCommand: vi.fn(function () {
      return {}
    }),
    SignCommand: vi.fn(function () {
      return {}
    }),
    KMSClient: vi.fn(function () {
      return { send }
    }),
  }
})
vi.mock('@aws-sdk/client-kms', () => kmsMocks)

const configMock = vi.hoisted(function () {
  return {
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
  } as any
})
vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('clients > s3', () => {
  // value from https://docs.yubico.com/yesdk/users-manual/application-piv/ecdsa-signatures.html
  const exampleSignatureString =
    '302c021500e91a49c5147db1a9aaf244f05a434d6486931d2d0213526db078b05edecbcd1eb4a208f3ae1617ae82'

  test('sign > success', async () => {
    kmsMocks.send.mockResolvedValueOnce({
      KeyMetadata: {
        SigningAlgorithms: ['abc'],
      },
    })
    kmsMocks.send.mockResolvedValueOnce({
      Signature: Buffer.from(exampleSignatureString, 'hex'),
    })

    await sign('hash123')

    expect(kmsMocks.DescribeKeyCommand).toHaveBeenCalledWith({
      KeyId: configMock.modelMirror.export.kmsSignature.keyId,
    })
    expect(kmsMocks.send).toHaveBeenCalled()
  })

  test('sign > invalid DER sequence', async () => {
    kmsMocks.send.mockResolvedValueOnce({
      KeyMetadata: {
        SigningAlgorithms: ['abc'],
      },
    })
    kmsMocks.send.mockResolvedValueOnce({
      Signature: Buffer.from(exampleSignatureString.substring(1), 'hex'),
    })

    await expect(sign('hash123')).rejects.toThrow(/^Invalid DER signature/)
  })

  test('sign > DER too short', async () => {
    kmsMocks.send.mockResolvedValueOnce({
      KeyMetadata: {
        SigningAlgorithms: ['abc'],
      },
    })
    kmsMocks.send.mockResolvedValueOnce({
      Signature: Buffer.from(exampleSignatureString.substring(0, exampleSignatureString.length - 1), 'hex'),
    })

    await expect(sign('hash123')).rejects.toThrow(/^Malformed DER sequence/)
  })

  test('sign > DER missing r integer', async () => {
    kmsMocks.send.mockResolvedValueOnce({
      KeyMetadata: {
        SigningAlgorithms: ['abc'],
      },
    })
    kmsMocks.send.mockResolvedValueOnce({
      Signature: Buffer.from(exampleSignatureString.substring(0, 5) + '3' + exampleSignatureString.substring(6), 'hex'),
    })

    await expect(sign('hash123')).rejects.toThrow(/^Invalid DER: missing r integer/)
  })

  test('sign > DER missing s integer', async () => {
    kmsMocks.send.mockResolvedValueOnce({
      KeyMetadata: {
        SigningAlgorithms: ['abc'],
      },
    })
    kmsMocks.send.mockResolvedValueOnce({
      Signature: Buffer.from(
        exampleSignatureString.substring(0, 51) + '3' + exampleSignatureString.substring(52),
        'hex',
      ),
    })

    await expect(sign('hash123')).rejects.toThrow(/^Invalid DER: missing s integer/)
  })

  test('sign > cannot get key information', async () => {
    kmsMocks.send.mockResolvedValueOnce({})
    kmsMocks.send.mockResolvedValueOnce({
      Signature: Buffer.from(exampleSignatureString, 'hex'),
    })

    const response = sign('hash123')

    expect(kmsMocks.DescribeKeyCommand).toHaveBeenCalledWith({
      KeyId: configMock.modelMirror.export.kmsSignature.keyId,
    })
    await expect(response).rejects.toThrow(/^Cannot get key information./)
  })

  test('sign > cannot get signature', async () => {
    const sendMock = vi.fn()
    sendMock
      .mockResolvedValueOnce({
        KeyMetadata: {
          SigningAlgorithms: ['abc'],
        },
      })
      .mockResolvedValueOnce({
        Signature: undefined,
      })
    kmsMocks.KMSClient.mockImplementation(function () {
      return { send: sendMock }
    })

    const response = sign('hash123')

    expect(kmsMocks.DescribeKeyCommand).toHaveBeenCalledWith({
      KeyId: configMock.modelMirror.export.kmsSignature.keyId,
    })
    await expect(response).rejects.toThrow(/^Cannot get signature./)
  })
})
