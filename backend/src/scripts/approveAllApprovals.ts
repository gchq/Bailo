import Bailo from '../connectors/BailoClient.js'
import logger from '../utils/logger.js'

async function approveAllApprovals() {
  const api = new Bailo('http://localhost:8080/api/v1')

  const deployments = await api.getApprovals('Deployment')
  const uploads = await api.getApprovals('Upload')

  for (const deployment of deployments) {
    const response = await deployment.respond('Accepted')
    logger.info(response, 'Responded to deployment')
  }

  for (const upload of uploads) {
    const response = await upload.respond('Accepted')
    logger.info(response, 'Responded to upload')
  }

  const numApprovals = uploads.length + deployments.length
  logger.info({ numApprovals }, `Approved all approvals`)
}

approveAllApprovals()
