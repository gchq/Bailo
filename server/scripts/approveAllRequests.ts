import Bailo from '../../lib/node'
import logger from '../utils/logger'

async function approveAllRequests() {
  const api = new Bailo('http://localhost:8080/api/v1')

  const deployments = await api.getRequests('Deployment')
  const uploads = await api.getRequests('Upload')

  for (const deployment of deployments) {
    const response = await deployment.respond('Accepted')
    logger.info(response, 'Responded to deployment')
  }

  for (const upload of uploads) {
    const response = await upload.respond('Accepted')
    logger.info(response, 'Responded to upload')
  }

  const numRequests = uploads.length + deployments.length
  logger.info({ numRequests }, `Approved all requests`)
}

approveAllRequests()
