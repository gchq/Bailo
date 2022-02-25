import { exec } from 'shelljs'
import packageInfo from '../../package.json'
import packageLock from '../../package-lock.json'

// This script requires 'license-checker'
//   npm i -g license-checker
export default async function runScript() {
  const { stdout } = exec('license-checker --json', { silent: true })
  const licenses = JSON.parse(stdout)

  const packages = Object.keys(packageInfo.dependencies).concat(Object.keys(packageInfo.devDependencies))
  const dependencies: any = {}

  for (let license of Object.keys(licenses)) {
    const name = license.split('@')[0]

    if (packages.includes(name)) {
      dependencies[name] = licenses[license]
    }
  }

  for (let [name, unknownLicense] of Object.entries(dependencies)) {
    let license = unknownLicense as any
    const version = packageLock.packages[`node_modules/${name}`].version
    console.log(`${name} v${version} <${license.licenses}>: ${license.repository}`)
  }
}

runScript()
