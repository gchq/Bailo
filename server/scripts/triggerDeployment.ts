import DeploymentModel from '../models/Deployment'
import { deploymentQueue } from '../utils/queues'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import logger from '../utils/logger'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
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

  const job = await deploymentQueue
    .createJob({
      deploymentId: deployment._id,
    })
    .timeout(60000)
    .retries(2)
    .save()

  logger.info('Started deployment')

  setTimeout(async () => {
    disconnectFromMongoose()
    await deploymentQueue.close(0)
    process.exit(0)
  }, 50)
})()
