import Queue from 'bee-queue'
import config from 'config'

export const uploadQueue = new Queue('UPLOAD_QUEUE', {
  redis: config.get('redis'),
})

export const deploymentQueue = new Queue('DEPLOYMENT_QUEUE', {
  redis: config.get('redis'),
})
