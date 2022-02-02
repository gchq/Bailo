import Queue from 'bee-queue'
import config from 'config'

export const uploadQueue = new Queue('UPLOAD_QUEUE', {
  redis: config.get('redis'),

  // model building may take a minutes, especially when the cache is cold
  stallInterval: 120000,
})

export const deploymentQueue = new Queue('DEPLOYMENT_QUEUE', {
  redis: config.get('redis'),
})
