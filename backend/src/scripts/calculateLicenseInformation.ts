import { execSync } from 'node:child_process'

import packageInfo from '../../package.json' with { type: 'json' }
import packageLock from '../../package-lock.json' with { type: 'json' }

// This script requires 'license-checker'
//   npm i -g license-checker
export default async function runScript() {
  const licenses = JSON.parse(execSync('license-checker --json').toString())

  const packages = Object.keys(packageInfo.dependencies).concat(Object.keys(packageInfo.devDependencies))
  const dependencies: Record<string, string> = {}

  for (const license of Object.keys(licenses)) {
    const name = license.split('@')[0]

    if (packages.includes(name)) {
      dependencies[name] = licenses[license]
    }
  }

  for (const [name, unknownLicense] of Object.entries(dependencies)) {
    const license = unknownLicense as any
    const { version } = (packageLock as any).packages[`node_modules/${name}`]

    // eslint-disable-next-line no-console
    console.log(`${name} v${version} <${license.licenses}>: ${license.repository}`)
  }
}

runScript()
