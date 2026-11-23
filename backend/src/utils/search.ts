// Minimum share of query trigrams an entry must contain to count as a fuzzy match.
export const FUZZY_MATCH_THRESHOLD = 0.4

/** Splits text into lowercase, space-padded word trigrams, e.g. 'yolo' -> ['  y', ' yo', 'yol', 'olo', 'lo ']. */
export function toSearchGrams(...texts: Array<string | undefined>): string[] {
  const grams = new Set<string>()
  for (const word of texts
    .join(' ')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)) {
    if (!word) {
      continue
    }
    const padded = `  ${word} `
    for (let i = 0; i < padded.length - 2; i++) {
      grams.add(padded.slice(i, i + 3))
    }
  }
  return [...grams]
}

/** Builds grams from the named fields of an entry, where array fields such as tags contribute each value. */
export function toEntrySearchGrams(entry: object, fields: readonly string[]): string[] {
  const texts = fields.flatMap((field) => (entry as Record<string, unknown>)[field] ?? []) as Array<string | undefined>
  return toSearchGrams(...texts)
}

/** Whether a Mongo update document or pipeline could change any of the fields that searchGrams is built from. */
export function touchesSearchFields(update: unknown, fields: readonly string[]): boolean {
  const isSearchPath = (path: string) => fields.includes(path.split('.')[0])
  if (Array.isArray(update)) {
    return true
  }
  if (!update || typeof update !== 'object') {
    return false
  }
  return Object.entries(update).some(([key, value]) => {
    if (!key.startsWith('$')) {
      return isSearchPath(key)
    }
    if (!value || typeof value !== 'object') {
      return false
    }
    return Object.entries(value).some(
      ([path, target]) =>
        isSearchPath(path) || (key === '$rename' && typeof target === 'string' && isSearchPath(target)),
    )
  })
}

/** Share of the query's trigrams that also appear in the entry, from 0 to 1. */
export function gramSimilarity(queryGrams: string[], entryGrams: string[] = []): number {
  if (queryGrams.length === 0) {
    return 0
  }
  const entrySet = new Set(entryGrams)
  return queryGrams.filter((gram) => entrySet.has(gram)).length / queryGrams.length
}
