import config from 'config'
import mongoose from 'mongoose'
import logger from './logger'

let connection: Promise<typeof mongoose> | undefined

export async function connectToMongoose() {
  try {
    connection = mongoose.connect(await config.get('mongo.uri'), {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })

    await connection

    logger.info('Connected to Mongoose')
  } catch (error) {
    logger.error({ error }, 'Error')
  }
}

export async function checkConnection() {
  if (connection === undefined) {
    connectToMongoose()
  }

  return connection
}

export async function disconnectFromMongoose() {
  await mongoose.disconnect()
  logger.info('Disconnected from Mongoose')
}
