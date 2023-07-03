import axios from 'axios'
import config from 'config'
import https from 'https'

import { getAccessToken } from '../routes/v1/registryAuth.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import logger from '../utils/logger.js'
import { createRegistryClient, getImageDigest, ImageRef } from '../utils/registry.js'

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
})

async function script() {
  await connectToMongoose()

  const registry = await createRegistryClient()
  const imageName = 'internal/minimal-model-for-testing-fewzmd'
  const image: ImageRef = {
    namespace: 'internal',
    model: 'minimal-model-for-testing-fewzmd',
    version: 'v1.0',
  }

  const token = await getAccessToken({ id: 'user', _id: 'user' }, [
    { type: 'repository', class: '', name: `${image.namespace}/${image.model}`, actions: ['delete'] },
  ])

  const authorisation = `Bearer ${token}`

  const digest = await getImageDigest(registry, image)

  const { data } = await axios.delete(`${registry.address}/${imageName}/manifests/${digest}`, {
    headers: {
      Authorization: authorisation,
    },
    httpsAgent,
  })

  logger.info(data, '')

  setTimeout(disconnectFromMongoose, 50)
}

script()
