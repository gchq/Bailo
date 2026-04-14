import { getApiVersion } from '../clients/registry.js'
import { issueAccessToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'

async function main() {
  const token = await issueAccessToken({ dn: 'user' }, [{ type: 'registry', name: 'catalog', actions: ['*'] }])
  log.info(await getApiVersion(token))
}

main()
