import getAppRoot from 'app-root-path'
import { readdir } from 'fs/promises'
import mongoose, { Types } from 'mongoose'
import { join } from 'path'

import log from '../services/log.js'
import { doesMigrationExist, markMigrationComplete } from '../services/migration.js'
import config from './config.js'

export function getConnectionURI() {
  return config.mongo.pass
    ? `${config.mongo.uri.replace('://', `://${config.mongo.user}:${config.mongo.pass}@`)}`
    : config.mongo.uri
}

export async function connectToMongoose() {
  // is it already connected
  if (Number(mongoose.connection.readyState) === 1) {
    return
  }

  try {
    mongoose.set('strictQuery', false)
    mongoose.set('strictPopulate', false)

    await mongoose.connect(getConnectionURI())
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
      const runMigration = await migration.up()

      await markMigrationComplete(file, runMigration)

      log.info({ file }, `Finished migration ${file}`)
    }
  }

  log.info('Finished running all migrations')
}

export function isObjectId(value: unknown): value is Types.ObjectId {
  return value instanceof Types.ObjectId
}

/**
 * Check if a replica set name is configured in the current connection, and assume
 * replica sets are enabled if so
 *
 * @returns true if a replica set name is available, otherwise false
 */
export function isReplicaSet(): boolean {
  const options = mongoose.connection.getClient().options
  return Object.prototype.hasOwnProperty.call(options, 'replicaSet') && options.replicaSet.length > 0
}

/**
 * Check if a replica set is configured AND app configuration allows the use of transactions
 *
 * @returns true if we're in replica set mode and configuration allows transactions, otherwise false
 */
export function useTransactions(): boolean {
  return isReplicaSet() && config.mongo.transactions
}
