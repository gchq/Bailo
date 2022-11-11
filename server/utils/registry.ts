import https from 'https'
import config from 'config'
import { getAccessToken } from '../routes/v1/registryAuth'
import logger from './logger'

interface ImageRef {
  namespace: string
  image: string
  version: string
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
})

export async function makeRegistryRequest({
  endpoint,
  authorisation,
  headers,
  metadata,
  method,
  json = true,
}: {
  endpoint: string
  authorisation: string
  method?: string
  headers?: any
  metadata?: any
  json?: boolean
}) {
  const registry = `${config.get('registry.protocol')}://${config.get('registry.host')}/v2`

  console.log(`${registry}${endpoint}`, {
    ...metadata,
    ...(method ? { method } : {}),
    headers: {
      ...headers,
      Authorization: 'authorisation bearer',
    },
  })

  return fetch(`${registry}${endpoint}`, {
    ...metadata,
    ...(method ? {} : { method }),
    headers: {
      ...headers,
      Authorization: authorisation,
    },
    agent: httpsAgent,
  } as RequestInit).then((res: any) => {
    logger.info(
      {
        status: res.status,
        endpoint,
      },
      'Made registry request'
    )

    if (res.status >= 400) {
      throw new Error(`Invalid status response: ${res.status}`)
    }

    if (json) {
      return res.json()
    }

    return res
  })
}

export async function copyDockerImage(from: ImageRef, to: ImageRef, log: (level: string, message: string) => void) {
  const token = await getAccessToken({ id: 'admin', _id: 'admin' }, [
    { type: 'repository', name: `${from.namespace}/${from.image}`, actions: ['pull'] },
    { type: 'repository', name: `${to.namespace}/${to.image}`, actions: ['push', 'pull'] },
  ])
  const authorisation = `Bearer ${token}`

  const manifest = await makeRegistryRequest({
    endpoint: `/${from.namespace}/${from.image}/manifests/${from.version}`,
    authorisation,
    headers: {
      Accept: 'application/vnd.docker.distribution.manifest.v2+json',
    },
  })

  console.log(manifest)

  await Promise.all(
    manifest.layers.map(async (layer: any) => {
      await makeRegistryRequest({
        endpoint: `/${to.namespace}/${to.image}/blobs/uploads/?mount=${layer.digest}&from=${from.namespace}/${from.image}`,
        authorisation,
        json: false,
        method: 'POST',
      })

      log('info', `Copied layer ${layer.digest}`)
    })
  )

  await makeRegistryRequest({
    endpoint: `/${to.namespace}/${to.image}/blobs/uploads/?mount=${manifest.config.digest}&from=${from.namespace}/${from.image}`,
    method: 'POST',
    authorisation,
  })

  log('info', 'Copied manifest to new repository')

  await makeRegistryRequest({
    endpoint: `/${to.namespace}/${to.image}/manifests/${to.version}`,
    method: 'PUT',
    authorisation,
    headers: {
      'Content-Type': 'application/vnd.docker.distribution.manifest.v2+json',
    },
  })

  log('info', 'Finalised new manifest')
}
