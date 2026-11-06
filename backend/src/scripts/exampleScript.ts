import ModelModel from '../models/Model.js'
import log from '../services/log.js'
import { defineScript } from './scriptHelper.js'

defineScript({
  name: 'exampleScript',
  description: 'Example script demonstrating the defineScript pattern',
  args: (yargs) =>
    yargs
      .option('modelId', { type: 'string', demandOption: true, describe: 'The model ID to look up' })
      .option('dryRun', { type: 'boolean', default: false, describe: 'Preview without making changes' }),
  run: async (args) => {
    log.info({ modelId: args.modelId, dryRun: args.dryRun }, 'Running example script')

    const model = await ModelModel.findOne({ id: args.modelId })
    if (!model) {
      throw new Error(`Model '${args.modelId}' not found`)
    }

    log.info({ name: model.name }, 'Found model')
  },
})
