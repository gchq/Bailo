import config from 'config'
import mongoose from 'mongoose'
import logger from './logger'

type ConnectionOptions = {
  useFindAndModify: boolean
  useNewUrlParser: boolean
  useUnifiedTopology: boolean
  useCreateIndex: boolean
}

export async function connectToMongoose() {
  // is it already connected
  if (Number(mongoose.connection.readyState) === 1) {
    return
  }

  try {
    await mongoose.connect(await config.get('mongo.uri'), config.get<ConnectionOptions>('mongo.connectionOptions'))

    logger.info('Connected to Mongoose')
  } catch (error) {
    logger.error({ error }, 'Error')
    throw error
  }
}

export async function disconnectFromMongoose() {
  await mongoose.disconnect()
  logger.info({ log: false }, 'Disconnected from Mongoose')
}
