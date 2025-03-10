import fetch from 'node-fetch'

import { getAccessToken } from '../routes/v1/registryAuth.js'
import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

const httpsAgent = getHttpsAgent({
  rejectUnauthorized: !config.registry.insecure,
})

async function script() {
  await connectToMongoose()

  const registry = `https://localhost:5000/v2`

  const token = await getAccessToken({ dn: 'user' }, [{ type: 'registry', class: '', name: 'catalog', actions: ['*'] }])

  const authorisation = `Bearer ${token}`

  const catalog = (await fetch(`${registry}/_catalog`, {
    headers: {
      Authorization: authorisation,
    },
    agent: httpsAgent,
  }).then((res) => res.json())) as object

  await Promise.all(
    catalog['repositories'].map(async (repositoryName) => {
      const repositoryToken = await getAccessToken({ dn: 'user' }, [
        { type: 'repository', class: '', name: repositoryName, actions: ['*'] },
      ])
      const repositoryAuthorisation = `Bearer ${repositoryToken}`

      const repositoryTags = (await fetch(`${registry}/${repositoryName}/tags/list`, {
        headers: {
          Authorization: repositoryAuthorisation,
        },
        agent: httpsAgent,
      }).then((res) => res.json())) as object

      await Promise.all(
        repositoryTags['tags'].map(async (tag) => {
          const repositoryDigest = await fetch(`${registry}/${repositoryName}/manifests/${tag}`, {
            headers: {
              Authorization: repositoryAuthorisation,
              Accept: 'application/vnd.docker.distribution.manifest.v2+json',
            },
            agent: httpsAgent,
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
