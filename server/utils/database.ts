import config from 'config'
import getAppRoot from 'app-root-path'
import { join } from 'path'
import { readdir } from 'fs/promises'
import mongoose from 'mongoose'
import logger from './logger'
import { doesMigrationExist, markMigrationComplete } from '../services/migration'

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

export async function runMigrations() {
  const path = process.env.NODE_ENV === 'production' ? './dist/server/migrations/' : './server/migrations/'
  const base = join(getAppRoot.toString(), path)
  const files = await readdir(base)
  files.sort()

  for (const file of files) {
    if (!file.endsWith('.js') || !file.endsWith('.ts')) {
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
