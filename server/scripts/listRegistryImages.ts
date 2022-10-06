/* eslint-disable import/newline-after-import */
import config from 'config'
import https from 'https'
import axios from 'axios'
import { getAccessToken } from '../routes/v1/registryAuth'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import logger from '../utils/logger'

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
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
