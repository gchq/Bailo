import semver from 'semver'

/**
 * Sort an array of semantic version strings.
 *
 * @param semvers Array of semantic versions to sort.
 * @param asc Sort ascending when true, descending when false.
 * @returns The sorted semantic versions.
 */
export const sortSemvers = (semvers: string[], asc = true): string[] => {
  return semvers.sort((a, b) => (asc ? semver.compare(a, b) : semver.compare(b, a)))
}
