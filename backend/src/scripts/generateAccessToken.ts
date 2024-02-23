import { getAccessToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'

async function main() {
  const model = 'nginx'

  const token = await getAccessToken({ dn: 'admin' }, [{ type: 'repository', name: model, actions: ['push', 'pull'] }])

  log.info(token)
}

main()
