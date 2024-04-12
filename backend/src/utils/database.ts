import getAppRoot from 'app-root-path'
import { readdir } from 'fs/promises'
import mongoose, { Types } from 'mongoose'
import { join } from 'path'

import log from '../services/log.js'
import { doesMigrationExist, markMigrationComplete } from '../services/migration.js'
import config from './config.js'

export async function connectToMongoose() {
  // is it already connected
  if (Number(mongoose.connection.readyState) === 1) {
    return
  }

  try {
    mongoose.set('strictQuery', false)
    mongoose.set('strictPopulate', false)

    const connectionURI = config.mongo.pass
      ? `${config.mongo.uri.replace('://', `://${config.mongo.user}:${config.mongo.pass}`)}`
      : config.mongo.uri

    await mongoose.connect(connectionURI)
    log.info('Connected to Mongoose')
  } catch (error) {
    log.error({ error }, 'Error')
    throw error
  }
}

export async function disconnectFromMongoose() {
  await mongoose.disconnect()
  log.info({ log: false }, 'Disconnected from Mongoose')
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
      log.info({ file }, `Running migration ${file}`)

      // run migration
      const migration = await import(join(base, file))
      await migration.up()

      await markMigrationComplete(file)

      log.info({ file }, `Finished migration ${file}`)
    }
  }

  log.info('Finished running all migrations')
}

export function isObjectId(value: unknown): value is Types.ObjectId {
  return value instanceof Types.ObjectId
}
