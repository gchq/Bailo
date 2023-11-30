import fetch from 'node-fetch'

import { ImageAction } from '../../connectors/v2/authorisation/Base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { UserDoc } from '../../models/v2/User.js'
import { Action, getAccessToken } from '../../routes/v1/registryAuth.js'
import config from '../../utils/v2/config.js'
import { Forbidden } from '../../utils/v2/error.js'
import { getHttpsAgent } from './http.js'
import { getModelById } from './model.js'

const registry = config.registry.connection.internal
const httpsAgent = getHttpsAgent({
  rejectUnauthorized: !config.registry.connection.insecure,
})

export interface RepoRef {
  repository: string
  name: string
}

// Currently limited to a maximum 100 image names
async function listModelRepos(user: UserDoc, modelId: string) {
  const token = await getAccessToken({ id: user.dn, _id: user.dn }, [
    { type: 'registry', class: '', name: 'catalog', actions: ['*'] },
  ])

  const authorisation = `Bearer ${token}`

  const catalog = await fetch(`${registry}/v2/_catalog?n=100&last=${modelId}`, {
    headers: {
      Authorization: authorisation,
    },
    agent: httpsAgent,
  }).then((res) => res.json() as Promise<{ repositories: Array<string> }>)

  return catalog.repositories.filter((repo) => repo.startsWith(`${modelId}/`))
}

async function listImageTags(user: UserDoc, imageRef: RepoRef) {
  const repo = `${imageRef.repository}/${imageRef.name}`
  const token = await getAccessToken({ id: user.dn, _id: user.dn }, [
    { type: 'repository', class: '', name: repo, actions: ['pull'] },
  ])

  const authorisation = `Bearer ${token}`

  const catalog = await fetch(`${registry}/v2/${repo}/tags/list`, {
    headers: {
      Authorization: authorisation,
    },
    agent: httpsAgent,
  }).then((res) => res.json() as Promise<{ tags: Array<string> }>)

  return catalog.tags
}

export async function listModelImages(user: UserDoc, modelId: string) {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.image(user, model, {
    type: 'repository',
    name: modelId,
    actions: [ImageAction.List as Action],
  })
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const repos = await listModelRepos(user, modelId)
  const versions = await Promise.all(
    repos.map(async (repo) => {
      const [repository, name] = repo.split('/')
      return { repository, name, tags: await listImageTags(user, { repository, name }) }
    }),
  )

  return versions
}
