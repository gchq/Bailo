import { deleteManifest, getImageTagManifest } from '../clients/registry.js'
import { issueAccessToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'

async function main() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  log.debug({ args })
  if (args.length !== 2) {
    log.error('Please use format "npm run script -- deleteRegistryImage <image> <tag>"')
    log.error('e.g. "npm run script -- deleteRegistryImage modelid-123456 latest"')
    return
  }
  const [image, tag] = args
  log.debug({ image, tag }, 'Got args')

  try {
    const user = { dn: 'admin' }
    const token = await issueAccessToken(user, [
      { type: 'repository', name: image, actions: ['push', 'pull', 'delete'] },
    ])
    /**
     * The invalid push was of the form:
     *   <registryHost>/<modelId>:<tag>
     *
     * i.e. no image name under the model. In registry terms this maps to:
     *   /v2/<modelId>/manifests/<tag>
     *
     * The registry client expects an ImageTagRef of the form:
     *   { repository, name, tag }
     *
     * To produce /v2/<modelId>/manifests/<tag>, we set:
     *   repository = ''
     *   name        = <modelId>
     *
     * The URL resolves to <registry>/v2//<image>/manifests/<tag> but HTTP URL
     * parsing treats multiple consecutive `/` characters in the path as
     * equivalent in most servers and proxies, so the extra `/` is ignored.
     */
    const imageRefByTag = {
      repository: '',
      name: image,
      tag,
    }

    log.info({ imageRefByTag }, 'Fetching manifest to resolve digest')
    const { headers } = await getImageTagManifest(token, imageRefByTag)
    const digest = headers['docker-content-digest']

    if (!digest) {
      log.error({ headers }, 'Manifest response missing Docker-Content-Digest header')
      return
    }
    log.info({ digest }, 'Resolved manifest digest')
    const imageRefByDigest = {
      repository: '',
      name: image,
      digest,
    }

    log.info({ imageRefByDigest }, 'Deleting manifest by digest')
    await deleteManifest(token, imageRefByDigest)
    log.info({ ...imageRefByDigest }, 'Successfully deleted registry image manifest by digest')
  } catch (err) {
    log.error({ err, image, tag }, 'Failed to delete registry image')
    process.exitCode = 1
  }
}

main()
