import { getAccessToken } from '../routes/v1/registryAuth.js'
import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

async function script() {
  await connectToMongoose()

  const registry = config.registry.connection.internal
  const token = await getAccessToken({ dn: 'user' }, [{ type: 'registry', name: 'catalog', actions: ['*'] }])
  const authorisation = `Bearer ${token}`
  const agent = getHttpsUndiciAgent({
    connect: { rejectUnauthorized: !config.registry.connection.insecure },
  })

  const catalog = await fetch(`${registry}/_catalog`, {
    headers: {
      Authorization: authorisation,
    },
    dispatcher: agent,
  }).then((res) => res.json())

  log.info(catalog, 'Current catalog')

  setTimeout(disconnectFromMongoose, 50)
}

script()
