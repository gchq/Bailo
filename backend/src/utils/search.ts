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

/** Share of the query's trigrams that also appear in the entry, from 0 to 1. */
export function gramSimilarity(queryGrams: string[], entryGrams: string[] = []): number {
  if (queryGrams.length === 0) {
    return 0
  }
  const entrySet = new Set(entryGrams)
  return queryGrams.filter((gram) => entrySet.has(gram)).length / queryGrams.length
}
