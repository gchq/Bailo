import { getAccessToken } from '../routes/registryAuth.js'
import log from '../services/v2/log.js'

async function main() {
  const model = 'nginx'

  const token = await getAccessToken({ dn: 'admin' }, [{ type: 'repository', name: model, actions: ['push', 'pull'] }])

  log.info(token)
}

main()
