import { readFile, writeFile } from 'fs/promises'
import r from 'jsrsasign'

import { getKid } from '../routes/v1/registryAuth.js'
import config from '../utils/config.js'

async function script() {
  const pem = await readFile(config.app.publicKey, { encoding: 'utf-8' })
  const key = r.KEYUTIL.getKey(pem)
  const jwk = r.KEYUTIL.getJWKFromKey(key)
  jwk.kid = await getKid()
  await writeFile(config.app.jwks, JSON.stringify({ keys: [jwk] }))
}
script()
