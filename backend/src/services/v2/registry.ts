import { listImageTags, listModelRepos } from '../../clients/registry.js'
import { ImageAction } from '../../connectors/v2/authorisation/base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { UserDoc } from '../../models/v2/User.js'
import { Action, getAccessToken } from '../../routes/v1/registryAuth.js'
import { Forbidden } from '../../utils/v2/error.js'
import { getModelById } from './model.js'

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

  const registryToken = await getAccessToken({ id: user.dn, _id: user.dn }, [
    { type: 'registry', class: '', name: 'catalog', actions: ['*'] },
  ])
  const repos = await listModelRepos(registryToken, modelId)
  const versions = await Promise.all(
    repos.map(async (repo) => {
      const [namespace, image] = repo.split('/')
      const repositoryToken = await getAccessToken({ id: user.dn, _id: user.dn }, [
        { type: 'repository', class: '', name: repo, actions: ['pull'] },
      ])
      return { repository: namespace, name: image, tags: await listImageTags(repositoryToken, { namespace, image }) }
    }),
  )

  return versions
}
