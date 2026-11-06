import { randomInt, randomUUID } from 'node:crypto'

const uppercaseAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const lowercaseAlphabet = uppercaseAlphabet.toLowerCase()
const numbers = '0123456789'

const shortAlphabetCharacters = `${numbers}${lowercaseAlphabet}`

/** Returns a cryptographically secure random string of `size` characters picked from `alphabet`. */
export function randomString(alphabet: string, size: number) {
  return Array.from({ length: size }, () => alphabet[randomInt(alphabet.length)]).join('')
}

export const shortAlphabet = (size: number) => randomString(`${numbers}${uppercaseAlphabet}`, size)
export const longAlphabet = (size: number) => randomString(`${numbers}${uppercaseAlphabet}${lowercaseAlphabet}`, size)

export function longId() {
  return randomUUID()
}

export function shortId() {
  return randomString(shortAlphabetCharacters, 6)
}

export function convertStringToId(string: string) {
  const safeString = string
    .toLowerCase()
    .replace(/[^a-z 0-9]/g, '')
    .replace(/ /g, '-')
    .slice(0, 128)

  return `${safeString}-${shortId()}`
}
