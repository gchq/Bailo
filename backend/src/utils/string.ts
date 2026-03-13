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
