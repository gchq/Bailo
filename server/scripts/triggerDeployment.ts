/* eslint-disable import/newline-after-import */
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import DeploymentModel from '../models/Deployment'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import logger from '../utils/logger'
import { closeMongoInstance, getDeploymentQueue } from '../utils/queues'
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
