import axios from 'axios'
import https from 'https'

import { getAccessToken } from '../routes/v1/registryAuth.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import logger from '../utils/logger.js'

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.registry.insecure,
})

async function script() {
  await connectToMongoose()

  const registry = `https://localhost:5000/v2`

  const token = await getAccessToken({ id: 'user', _id: 'user' }, [
    { type: 'registry', class: '', name: 'catalog', actions: ['*'] },
  ])

  const authorisation = `Bearer ${token}`

  const { data: catalog } = await axios.get(`${registry}/_catalog`, {
    headers: {
      Authorization: authorisation,
    },
    httpsAgent,
  })

  logger.info(catalog, 'Current catalog')

  setTimeout(disconnectFromMongoose, 50)
}

script()
