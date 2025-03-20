import shelljs from 'shelljs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const { exec } = shelljs

// This file allows you to run scripts as:
//   npm run script -- uploadExampleModel
// instead of the more verbose
//   npx tsx src/scripts/uploadExampleModel.ts
export default async function runScript() {
  const argv = await yargs(hideBin(process.argv)).usage('Usage: $0 [script]').argv
  const script = argv._[0]
  const args = argv._.slice(1)

  exec(`npx tsx src/scripts/${script}.ts ${args}`)
}

runScript()
