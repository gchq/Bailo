import { describe, expect, test } from 'vitest'

import { FUZZY_MATCH_THRESHOLD, gramSimilarity, toSearchGrams } from '../../src/utils/search.js'

describe('utils > search', () => {
  test('toSearchGrams > pads, lowercases and dedupes words', () => {
    expect(toSearchGrams('Yolo')).toEqual(['  y', ' yo', 'yol', 'olo', 'lo '])
    expect(toSearchGrams('a-a', undefined)).toEqual(['  a', ' a '])
    expect(toSearchGrams('', '  ')).toEqual([])
  })

  test('gramSimilarity > typo still matches', () => {
    const entry = toSearchGrams('Image classifier', 'Detects cats')
    expect(gramSimilarity(toSearchGrams('clasifier'), entry)).toBeGreaterThanOrEqual(FUZZY_MATCH_THRESHOLD)
    expect(gramSimilarity(toSearchGrams('classif'), entry)).toBeGreaterThanOrEqual(FUZZY_MATCH_THRESHOLD)
  })

  test('gramSimilarity > unrelated word does not match', () => {
    const entry = toSearchGrams('Image classifier', 'Detects cats')
    expect(gramSimilarity(toSearchGrams('translation'), entry)).toBeLessThan(FUZZY_MATCH_THRESHOLD)
    expect(gramSimilarity([], entry)).toBe(0)
  })
})
