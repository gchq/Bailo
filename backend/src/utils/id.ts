import { customAlphabet } from 'nanoid'
import { v4 as generateUuidv4 } from 'uuid'

const uppercaseAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const lowercaseAlphabet = uppercaseAlphabet.toLowerCase()
const numbers = '0123456789'

const shortAlphabetCharacters = `${numbers}${lowercaseAlphabet}`
export const shortAlphabet = customAlphabet(`${numbers}${uppercaseAlphabet}`)
export const longAlphabet = customAlphabet(`${numbers}${uppercaseAlphabet}${lowercaseAlphabet}`)

export function longId() {
  return generateUuidv4()
}

const nanoid = customAlphabet(shortAlphabetCharacters, 6)
export function shortId() {
  return nanoid()
}

export function convertStringToId(string: string) {
  const safeString = string
    .toLowerCase()
    .replace(/[^a-z 0-9]/g, '')
    .replace(/ /g, '-')
    .slice(0, 128)

  return `${safeString}-${shortId()}`
}
