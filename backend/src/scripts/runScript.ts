import shelljs from 'shelljs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const { exec } = shelljs

// This file allows you to run scripts as:
//   npm run script -- uploadExampleModel
// instead of the more verbose
//   npx ts-node src/scripts/uploadExampleModel.ts
export default async function runScript() {
  const argv = await yargs(hideBin(process.argv)).usage('Usage: $0 [script]').argv
  const script = argv._

  exec(`npx ts-node src/scripts/${script}.ts`)
}

runScript()
