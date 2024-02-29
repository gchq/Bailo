import getAppRoot from 'app-root-path'
import { readdir } from 'fs/promises'
import mongoose, { Types } from 'mongoose'
import { join } from 'path'

import { doesMigrationExist, markMigrationComplete } from '../services/migration.js'
import config from './config.js'
import logger from './logger.js'

export async function connectToMongoose() {
  // is it already connected
  if (Number(mongoose.connection.readyState) === 1) {
    return
  }

  try {
    mongoose.set('strictQuery', false)
    mongoose.set('strictPopulate', false)
    await mongoose.connect(config.mongo.uri)
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

export async function runMigrations() {
  const base = join(getAppRoot.toString(), './src/migrations/')
  const files = await readdir(base)
  files.sort()

  for (const file of files) {
    // Don't process non code files
    if (!file.endsWith('.js') && !file.endsWith('.ts')) {
      continue
    }

    // Don't process declaration files
    if (file.endsWith('.d.ts')) {
      continue
    }

    if (!(await doesMigrationExist(file))) {
      logger.info({ file }, `Running migration ${file}`)

      // run migration
      const migration = await import(join(base, file))
      await migration.up()

      await markMigrationComplete(file)

      logger.info({ file }, `Finished migration ${file}`)
    }
  }

  logger.info('Finished running all migrations')
}

export function isObjectId(value: unknown): value is Types.ObjectId {
  return value instanceof Types.ObjectId
}
