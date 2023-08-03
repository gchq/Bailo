import { ReleaseInterface } from '../types/types'

export const sortByReleaseVersionDescending = (a: ReleaseInterface, b: ReleaseInterface) => {
  if (a.semver < b.semver) return 1
  if (b.semver > a.semver) return -1
  return 0
}
