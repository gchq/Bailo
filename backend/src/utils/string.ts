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
