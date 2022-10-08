import config from 'config'
import mongoose from 'mongoose'
import logger from './logger'

// singleton connection instance across the whole application
let connection: Promise<typeof mongoose> | undefined

export async function connectToMongoose() {
  if (connection !== undefined) {
    return connection
  }

  // don't connect if already connected (e.g. test environment)
  if (mongoose.connection) {
    // we need to check the connection is ready
    if (mongoose.connection.readyState !== 2) {
      await new Promise((resolve) => {
        mongoose.connection.on('connected', resolve)
      })
    }

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
