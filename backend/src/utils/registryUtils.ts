import { createHash, X509Certificate } from 'crypto'
import { readFile } from 'fs/promises'

import config from './config.js'

export async function getKid(cert?: X509Certificate) {
  if (!cert) {
    cert = new X509Certificate(await getPublicKey())
  }
  const der = cert.publicKey.export({ format: 'der', type: 'spki' })
  const hash = createHash('sha256').update(der).digest().slice(0, 30)

  return formatKid(hash)
}
export function formatKid(keyBuffer: Buffer) {
  const bitLength = keyBuffer.length * 8

  if (bitLength % 40 !== 0) {
    throw new Error('Invalid bitLength provided, expected multiple of 40')
  }

  let output = ''
  for (let i = 0; i < bitLength; i += 5) {
    let idx = 0
    for (let j = 0; j < 5; j += 1) {
      idx <<= 1
      idx += getBit(keyBuffer, i + j)
    }
    output += alphabet[idx]
  }

  const match = output.match(/.{1,4}/g)
  if (match === null) {
    throw new Error('KeyBuffer format failed, match did not find any sections.')
  }

  return match.join(':')
}
export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export async function getPublicKey() {
  return readFile(config.app.publicKey, { encoding: 'utf-8' })
}
export function getBit(buffer: Buffer, index: number) {
  const byte = ~~(index / 8)
  const bit = index % 8
  const idByte = buffer[byte]
  return Number((idByte & (2 ** (7 - bit))) !== 0)
}
