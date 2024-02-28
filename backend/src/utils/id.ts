import { customAlphabet } from 'nanoid'
import { v4 as generateUuidv4 } from 'uuid'

export function longId() {
  return generateUuidv4()
}

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)
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
