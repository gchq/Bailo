import mongoose from 'mongoose'
import yargs, { type ArgumentsCamelCase, type Argv } from 'yargs'
import { hideBin } from 'yargs/helpers'

import log from '../services/log.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'

type ScriptArgs = Record<string, unknown>
interface ScriptDefinition<T extends ScriptArgs> {
  name: string
  description: string
  args: (y: Argv) => Argv<T>
  run: (args: ArgumentsCamelCase<T>) => Promise<void>
  connectToMongo?: boolean
}

export function defineScript<T extends ScriptArgs>(def: ScriptDefinition<T>) {
  const argv = def.args(
    yargs(hideBin(process.argv))
      .scriptName(def.name)
      .usage(`${def.description}\n\nUsage: $0 [options]`)
      .epilogue(
        'Run inside the backend container/pod:\n' +
          `  docker compose exec backend npx tsx src/scripts/${def.name}.ts [options]\n` +
          `  kubectl exec -it deploy/backend -- npx tsx src/scripts/${def.name}.ts [options]`,
      ),
  )

  async function execute() {
    const args = await argv.strict().help().argv

    try {
      if (def.connectToMongo !== false) {
        await connectToMongoose()
      }

      await def.run(args)
    } catch (err) {
      log.error(err, 'Script failed')
      process.exitCode = 1
    } finally {
      if (def.connectToMongo !== false && mongoose.connection.readyState !== 0) {
        await disconnectFromMongoose()
      }
    }
  }

  execute()
}
