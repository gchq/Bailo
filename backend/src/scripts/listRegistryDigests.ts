import { AcceptManifestMediaTypeHeaderValue } from '../clients/registryResponses.js'
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

  const catalog = (await fetch(`${registry}/v2/_catalog`, {
    headers: {
      Authorization: authorisation,
    },
    dispatcher: agent,
  }).then((res) => res.json())) as object

  await Promise.all(
    catalog['repositories'].map(async (repositoryName) => {
      const repositoryToken = await getAccessToken({ dn: 'user' }, [
        { type: 'repository', name: repositoryName, actions: ['*'] },
      ])
      const repositoryAuthorisation = `Bearer ${repositoryToken}`

      const repositoryTags = (await fetch(`${registry}/v2/${repositoryName}/tags/list`, {
        headers: {
          Authorization: repositoryAuthorisation,
        },
        dispatcher: agent,
      }).then((res) => res.json())) as object

      await Promise.all(
        repositoryTags['tags'].map(async (tag) => {
          const repositoryDigest = await fetch(`${registry}/v2/${repositoryName}/manifests/${tag}`, {
            headers: {
              Authorization: repositoryAuthorisation,
              Accept: AcceptManifestMediaTypeHeaderValue,
            },
            dispatcher: agent,
          }).then((res) => {
            return res.headers.get('docker-content-digest')
          })

          log.info({ repositoryName: repositoryName, tag: tag, digest: repositoryDigest }, 'Digest')
        }),
      )
    }),
  )

  setTimeout(disconnectFromMongoose, 50)
}

script()
