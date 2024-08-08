import { getAdminToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'

async function main() {
  const token = await getAdminToken()

  log.info(`Admin token: ${token}`)
}
main()
