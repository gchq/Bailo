import { getApiVersion } from '../clients/registry.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'

async function main() {
  const token = await getAccessToken({ dn: 'user' }, [{ type: 'registry', name: 'catalog', actions: ['*'] }])
  log.info(await getApiVersion(token))
}

main()
