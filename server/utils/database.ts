import config from 'config'
import mongoose from 'mongoose'
import logger from './logger'

// singleton connection instance across the whole application
let connection: Promise<typeof mongoose> | undefined

export async function connectToMongoose() {
  if (connection !== undefined) {
    return connection
  }

  if (mongoose.connection) {
    return mongoose
  }

  try {
    connection = mongoose.connect(config.get('mongo.uri'), {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })

    await connection

    logger.info('Connected to Mongoose')
  } catch (error) {
    logger.error({ error }, 'Error')
    throw error
  }

  return connection
}

export async function disconnectFromMongoose() {
  await mongoose.disconnect()
  logger.info('Disconnected from Mongoose')
}
