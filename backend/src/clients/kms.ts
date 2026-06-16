import { DescribeKeyCommand, KMSClient, SignCommand, SignCommandOutput } from '@aws-sdk/client-kms'

import config from '../utils/config.js'
import { InternalError } from '../utils/error.js'

const uint8ArrayFromHexString = (hexstring) =>
  Uint8Array.from(hexstring.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

export async function sign(hash: string) {
  const keyId = config.modelMirror.export.kmsSignature.keyId
  const clientConfig = config.modelMirror.export.kmsSignature.KMSClient
  const client = new KMSClient({
    ...(clientConfig.credentials?.accessKeyId &&
      clientConfig.credentials?.secretAccessKey && {
        credentials: { ...clientConfig.credentials },
        region: clientConfig.region,
      }),
  })

  const describeKeyCommand = new DescribeKeyCommand({ KeyId: keyId })
  const keyResponse = await client.send(describeKeyCommand)
  if (!keyResponse.KeyMetadata || !keyResponse.KeyMetadata.SigningAlgorithms) {
    throw InternalError('Cannot get key information.', { response: keyResponse })
  }
  const signingAlgorithm = keyResponse.KeyMetadata.SigningAlgorithms[0]

  const signCommand = new SignCommand({
    KeyId: keyId,
    SigningAlgorithm: signingAlgorithm,
    Message: uint8ArrayFromHexString(hash),
    MessageType: 'DIGEST',
  })
  const signResponse = await client.send(signCommand)
  return getSignatureValues(signResponse)
}

function getSignatureValues(signResponse: SignCommandOutput) {
  if (!signResponse.Signature) {
    throw InternalError('Cannot get signature.', { response: signResponse })
  }
  const { r, s } = parseEcdsaDerSignature(signResponse.Signature)

  return {
    'sig-r': r.toString(),
    'sig-s': s.toString(),
  }
}

function parseEcdsaDerSignature(sig: Uint8Array) {
  let offset = 0

  if (sig[offset++] !== 0x30) {
    throw new Error('Invalid DER signature')
  }

  const seqLen = sig[offset++]
  if (seqLen + 2 !== sig.length) {
    throw new Error('Malformed DER sequence')
  }

  if (sig[offset++] !== 0x02) {
    throw new Error('Invalid DER: missing r integer')
  }

  const rLen = sig[offset++]
  const r = sig.slice(offset, offset + rLen)
  offset += rLen

  if (sig[offset++] !== 0x02) {
    throw new Error('Invalid DER: missing s integer')
  }

  const sLen = sig[offset++]
  const s = sig.slice(offset, offset + sLen)

  return {
    r: BigInt('0x' + Buffer.from(r).toString('hex')),
    s: BigInt('0x' + Buffer.from(s).toString('hex')),
  }
}
