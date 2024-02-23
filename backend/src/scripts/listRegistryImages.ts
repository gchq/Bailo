import fetch from 'node-fetch'

import { getAccessToken } from '../routes/registryAuth.js'
import { getHttpsAgent } from '../services/v2/http.js'
import log from '../services/v2/log.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

const httpsAgent = getHttpsAgent({
  rejectUnauthorized: !config.registry.insecure,
})

async function script() {
  await connectToMongoose()

  const registry = `https://localhost:5000/v2`

  const token = await getAccessToken({ id: 'user', _id: 'user' }, [
    { type: 'registry', class: '', name: 'catalog', actions: ['*'] },
  ])

  const authorisation = `Bearer ${token}`

  const catalog = await fetch(`${registry}/_catalog`, {
    headers: {
      Authorization: authorisation,
    },
    agent: httpsAgent,
  }).then((res) => res.json())

  log.info(catalog, 'Current catalog')

  setTimeout(disconnectFromMongoose, 50)
}

script()
