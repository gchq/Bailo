import semver from 'semver'

export const toTitleCase = (value: string): string => {
  return value
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
}

export const toSentenceCase = (value: string): string => {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`.replace(/[-_]/g, ' ')
}

export const plural = (value: number, phrase: string) => {
  return `${value} ${phrase}${value === 1 ? '' : 's'}`
}

export const isValidSemver = (semverInput: string) => {
  return !!semver.valid(semverInput)
}

export const isValidPortNumber = (portNumber: string) => {
  const numericPortNumber = Number(portNumber)
  return (
    !isNaN(numericPortNumber) &&
    Number.isInteger(numericPortNumber) &&
    numericPortNumber > 0 &&
    numericPortNumber <= 65535
  )
}

export const toKebabCase = (value: string): string => {
  return value
    .replace(/[^\w -]/g, '')
    .replaceAll(' ', '-')
    .toLowerCase()
}
