import { EntryKind, EntryKindKeys } from '../models/Model.js'

/**
 * Naive utility to pluralise a word. Only covers +s and +es grammar rules.
 *
 * @param value number of the phrase to have
 * @param phrase noun to potentially pluralise
 * @returns correctly pluralised text joining value and phrase
 */
export const plural = (value: number, phrase: string) => {
  return `${value} ${phrase}${value === 1 ? '' : phrase.endsWith('s') ? 'es' : 's'}`
}

export const toTitleCase = (value: string, delimiter: string = ' '): string => {
  return value
    .replace(/[-_]/g, ' ')
    .split(delimiter)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
}

export const resolveKindToUrl = (kind: EntryKindKeys): string =>
  kind === EntryKind.DataCard ? EntryKind.DataCard : EntryKind.Model

/** Formats 16 bytes as a hyphenated UUID string, e.g. `00112233-4455-6677-8899-aabbccddeeff`. */
export const bytesToUuid = (bytes: Uint8Array): string => {
  if (bytes.length !== 16) {
    throw new Error(`A UUID needs exactly 16 bytes, received ${bytes.length}`)
  }
  const hex = Buffer.from(bytes).toString('hex')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')
}
