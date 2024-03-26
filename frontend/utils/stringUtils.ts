import semver from 'semver'

export const toTitleCase = (value: string): string =>
  value
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')

export const plural = (value: number, phrase: string) => {
  return `${value} ${phrase}${value === 1 ? '' : 's'}`
}

export const isValidSemver = (semverInput: string) => {
  return !!semver.valid(semverInput)
}

export const toKebabCase = (value: string): string => {
  return value.toLowerCase().replaceAll(' ', '-')
}
