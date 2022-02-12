import { exec } from 'shelljs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// This file allows you to run scripts as:
//   npm run script -- uploadExampleModel
// instead of the more verbose
//   TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true TS_NODE_PROJECT=tsconfig.server.json node --trace-warnings -r ts-node/register -r tsconfig-paths/register server/scripts/uploadExampleModel.ts
export default async function runScript() {
  const argv = await yargs(hideBin(process.argv)).usage('Usage: $0 [script]').argv
  const script = argv._

  exec(`TS_NODE_FILES=true TS_NODE_TRANSPILE_ONLY=true TS_NODE_PROJECT=tsconfig.server.json node --trace-warnings -r ts-node/register -r tsconfig-paths/register server/scripts/${script}.ts`)
}

runScript()