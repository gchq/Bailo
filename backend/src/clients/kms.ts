import { DescribeKeyCommand, KMSClient, SignCommand, SignCommandOutput } from '@aws-sdk/client-kms'
import { ASN1HEX } from 'jsrsasign'

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
  const values = await getSignatureValues(signResponse)
  return values
}

async function getSignatureValues(signResponse: SignCommandOutput) {
  if (!signResponse.Signature) {
    throw InternalError('Cannot get signature.', { response: signResponse })
  }
  const hex = Buffer.from(signResponse.Signature).toString('hex')
  const intIdx = ASN1HEX.getChildIdx(hex, 0)
  const rBigInt = BigInt('0x' + ASN1HEX.getV(hex, intIdx[0])) // Convert r/s values from hex to big integers
  const sBigInt = BigInt('0x' + ASN1HEX.getV(hex, intIdx[1]))

  return { 'sig-r': rBigInt.toString(), 'sig-s': sBigInt.toString() }
}
