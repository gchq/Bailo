import config from 'config'
import mongoose from 'mongoose'
import logger from './logger'

export async function connectToMongoose() {
  try {
    await mongoose.connect(await config.get('mongo.uri'), config.get('mongo.connectionOptions'))
    logger.info('Connected to Mongoose')
  } catch (error) {
    logger.error({ error }, 'Error')
  }
}

export async function disconnectFromMongoose() {
  await mongoose.disconnect()
  logger.info('Disconnected from Mongoose')
}
