import { spawnSync } from 'node:child_process'

// This file allows you to run scripts as:
//   npm run script -- uploadExampleModel
// instead of the more verbose
//   npx tsx src/scripts/uploadExampleModel.ts
export default function runScript() {
  const [script, ...args] = process.argv.slice(2)
  if (!script) {
    // eslint-disable-next-line no-console
    console.error('Usage: npm run script -- <script> [args...]')
    process.exit(1)
  }

  const { status } = spawnSync('npx', ['tsx', `src/scripts/${script}.ts`, ...args], { stdio: 'inherit' })
  process.exitCode = status ?? 1
}

runScript()
