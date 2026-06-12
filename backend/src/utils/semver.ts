import { SemverObject } from '../models/Release.js'

export function semverStringToObject(semver: string): SemverObject {
  const vIdentifierIndex = semver.indexOf('v')
  const trimmedSemver = vIdentifierIndex === -1 ? semver : semver.slice(vIdentifierIndex + 1)
  const [version, metadata] = trimmedSemver.split('-')
  const [major, minor, patch] = version.split('.')
  const majorNum: number = Number(major)
  const minorNum: number = Number(minor)
  const patchNum: number = Number(patch)
  return { major: majorNum, minor: minorNum, patch: patchNum, ...(metadata && { metadata }) }
}

export function semverObjectToString(semver: SemverObject): string {
  if (!semver) {
    return ''
  }
  let metadata: string
  if (semver.metadata != undefined) {
    metadata = `-${semver.metadata}`
  } else {
    metadata = ``
  }
  return `${semver.major}.${semver.minor}.${semver.patch}${metadata}`
}
