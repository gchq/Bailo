import { getImageTagManifest, listImageTags, listModelRepos } from '../clients/registry.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'
import { isRegistryError } from '../types/RegistryError.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

const digestsToSearchFor: string[] = []

interface AffectedImage {
  modelId: string
  image: string
  tag: string
  digest: string
  digestType: 'manifest' | 'image' | 'layer'
}

async function script() {
  await connectToMongoose()

  const registryToken = await getAccessToken({ dn: 'user' }, [{ type: 'registry', name: 'catalog', actions: ['*'] }])
  const repositories = await listModelRepos(registryToken, '')
  log.info({ amount: repositories.length }, 'Retrieved repositories')

  const affectedImages: AffectedImage[] = []
  const foundDigests = new Set<string>()

  for (const repository of repositories) {
    const [modelId, image] = repository.split('/')

    const repoToken = await getAccessToken({ dn: 'user' }, [{ type: 'repository', name: repository, actions: ['*'] }])

    const tags = await listImageTags(repoToken, {
      repository,
      name: '',
    })

    log.info({ repository, amount: tags.length, tags }, 'Retrieved tags for repository')

    for (const tag of tags) {
      const baseInfo = { modelId, image, tag }

      try {
        const { body: manifest, headers } = await getImageTagManifest(repoToken, {
          repository,
          name: '',
          tag,
        })

        if (!manifest) {
          continue
        }

        const manifestDigest = headers['docker-content-digest']?.replace('sha256:', '') ?? ''

        const imageDigest = manifest.config.digest.replace('sha256:', '')
        const layerDigests = manifest.layers.map((l) => l.digest.replace('sha256:', ''))

        if (digestsToSearchFor.includes(manifestDigest)) {
          affectedImages.push({
            ...baseInfo,
            digest: manifestDigest,
            digestType: 'manifest',
          })
          foundDigests.add(manifestDigest)
        }

        if (digestsToSearchFor.includes(imageDigest)) {
          affectedImages.push({
            ...baseInfo,
            digest: imageDigest,
            digestType: 'image',
          })
          foundDigests.add(imageDigest)
        }

        for (const layer of layerDigests) {
          if (digestsToSearchFor.includes(layer)) {
            affectedImages.push({
              ...baseInfo,
              digest: layer,
              digestType: 'layer',
            })
            foundDigests.add(layer)
          }
        }
      } catch (error) {
        // Handle deleted / missing manifests
        if (isRegistryError(error) && error.errors.at(0)?.code === 'MANIFEST_UNKNOWN') {
          const detail = error.errors.at(0)?.detail
          if (typeof detail === 'string' && detail.includes('sha256:')) {
            const digest = detail.slice(detail.indexOf('sha256:') + 'sha256:'.length)

            affectedImages.push({
              ...baseInfo,
              digest,
              digestType: 'manifest',
            })
            foundDigests.add(digest)
            continue
          }
        }

        throw error
      }
    }
  }

  const digestsNotFound = digestsToSearchFor.filter((digest) => !foundDigests.has(digest))

  log.info(affectedImages, 'Affected images')
  log.info('Warning: If manifest data is missing, image and layer digests cannot be checked.')
  log.info(digestsNotFound, 'Digests not found')

  setTimeout(disconnectFromMongoose, 50)
}

await script()
