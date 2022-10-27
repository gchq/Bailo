import config from 'config'
import mongoose from 'mongoose'
import logger from './logger'

type ConnectionOptions = {
  useFindAndModify: boolean
  useNewUrlParser: boolean
  useUnifiedTopology: boolean
  useCreateIndex: boolean
}

// singleton connection instance across the whole application
let connection: Promise<typeof mongoose> | undefined

export async function connectToMongoose() {
  if (connection !== undefined) {
    return connection
  }

  if (process.env.NODE_ENV === 'test') {
    return mongoose
  }

  try {
    connection = mongoose.connect(
      await config.get('mongo.uri'),
      config.get<ConnectionOptions>('mongo.connectionOptions')
    )

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
