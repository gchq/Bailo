import { existsSync } from 'fs'
import { createRequire } from 'module'
import mongoose from 'mongoose'
import { join } from 'path'
import yargs, { type ArgumentsCamelCase, type Argv } from 'yargs'
import { hideBin } from 'yargs/helpers'

import log from '../services/log.js'
import { getConnectionURI } from '../utils/database.js'

const require = createRequire(import.meta.url)

type ScriptArgs = Record<string, unknown>
interface ScriptDefinition<T extends ScriptArgs> {
  name: string
  description: string
  args: (y: Argv) => Argv<T>
  run: (args: ArgumentsCamelCase<T>) => Promise<void>
  connectToMongo?: boolean
}

function isRunningInDocker() {
  return existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true'
}

function getScriptConnectionURI(): string {
  if (isRunningInDocker()) {
    return getConnectionURI()
  }

  const configDir = join(import.meta.dirname, '../../config')
  const dockerConfigs = ['dev_docker_compose.cjs', 'prod_docker_compose.cjs']

  for (const file of dockerConfigs) {
    const filePath = join(configDir, file)
    if (!existsSync(filePath)) {
      continue
    }

    const dockerConfig = require(filePath)
    if (dockerConfig?.mongo?.uri) {
      try {
        const uri = new URL(dockerConfig.mongo.uri)

        if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol)) {
          throw new Error('Unsupported MongoDB protocol')
        }

        uri.hostname = 'localhost'
        uri.searchParams.set('directConnection', 'true')
        uri.searchParams.delete('replicaSet')
        return uri.toString()
      } catch (err) {
        log.warn({ err, file }, 'Invalid MongoDB configuration')
      }
    }
  }

  return getConnectionURI()
}

async function connectForScript() {
  if (Number(mongoose.connection.readyState) === 1) {
    return
  }

  mongoose.set('strictQuery', false)
  mongoose.set('strictPopulate', false)
  mongoose.set('updatePipeline', true)

  const uri = getScriptConnectionURI()
  await mongoose.connect(uri)
  log.info('Connected to Mongoose')
}

async function disconnectForScript() {
  await mongoose.disconnect()
  log.info({ log: false }, 'Disconnected from Mongoose')
}

export function defineScript<T extends ScriptArgs>(def: ScriptDefinition<T>) {
  const argv = def.args(
    yargs(hideBin(process.argv)).scriptName(def.name).usage(`${def.description}\n\nUsage: $0 [options]`),
  )

  async function execute() {
    const args = await argv.strict().help().argv

    try {
      if (def.connectToMongo !== false) {
        await connectForScript()
      }

      await def.run(args)
    } catch (err) {
      log.error(err, 'Script failed')
      process.exitCode = 1
    } finally {
      if (def.connectToMongo !== false && mongoose.connection.readyState !== 0) {
        await disconnectForScript()
      }
    }
  }

  execute()
}
