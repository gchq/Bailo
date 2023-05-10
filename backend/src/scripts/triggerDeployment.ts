import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import DeploymentModel from '../models/Deployment.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import logger from '../utils/logger.js'
import { closeMongoInstance, getDeploymentQueue } from '../utils/queues.js'
;(async () => {
  await connectToMongoose()

  const argv = await yargs(hideBin(process.argv)).usage('Usage: $0 [uuid]').argv

  const uuid = argv._
  const deployment = await DeploymentModel.findOne({
    uuid,
  })

  if (!deployment) {
    throw new Error('Unable to find deployment')
  }

  await (
    await getDeploymentQueue()
  ).add({
    deploymentId: deployment._id,
  })

  logger.info('Started deployment')

  setTimeout(async () => {
    disconnectFromMongoose()
    await closeMongoInstance()
    process.exit(0)
  }, 50)
})()
