import { createPublicKey } from 'crypto'
import { readFile, writeFile } from 'fs/promises'

import config from '../utils/config.js'
import { getKid } from '../utils/registryUtils.js'

async function script() {
  const pem = await readFile(config.app.publicKey, { encoding: 'utf-8' })
  const key = createPublicKey(pem)
  const jwk = key.export({ format: 'jwk' })
  const jwksKey = { ...jwk, kid: await getKid() }
  await writeFile(config.app.jwks, JSON.stringify({ keys: [jwksKey] }))
}
script()
