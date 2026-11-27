import { describe, expect, test } from 'vitest'

import {
  FUZZY_MATCH_THRESHOLD,
  gramSimilarity,
  toEntrySearchGrams,
  toSearchGrams,
  touchesSearchFields,
} from '../../src/utils/search.js'

const fields = ['name', 'description', 'tags']

describe('utils > search', () => {
  test('toEntrySearchGrams > builds grams from scalar and array fields only', () => {
    const entry = { name: 'Yolo', description: undefined, tags: ['cat'], other: 'ignored' }
    expect(toEntrySearchGrams(entry, fields)).toEqual(toSearchGrams('Yolo', 'cat'))
    expect(toEntrySearchGrams(entry, ['other'])).toEqual(toSearchGrams('ignored'))
  })

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

  test('touchesSearchFields > detects updates to the configured fields', () => {
    expect(touchesSearchFields({ $set: { name: 'a' } }, fields)).toBe(true)
    expect(touchesSearchFields({ $push: { tags: 'a' } }, fields)).toBe(true)
    expect(touchesSearchFields({ $set: { 'tags.0': 'a' } }, fields)).toBe(true)
    expect(touchesSearchFields({ $rename: { other: 'description' } }, fields)).toBe(true)
    expect(touchesSearchFields({ description: 'a' }, fields)).toBe(true)
    expect(touchesSearchFields([{ $set: { card: 'a' } }], fields)).toBe(true)
    expect(touchesSearchFields({ $set: { title: 'a' } }, ['title'])).toBe(true)
  })

  test('touchesSearchFields > ignores unrelated updates', () => {
    expect(touchesSearchFields({ $set: { card: {}, nameless: 'a' } }, fields)).toBe(false)
    expect(touchesSearchFields({ deleted: true, deletedAt: 'now' }, fields)).toBe(false)
    expect(touchesSearchFields({ $set: { name: 'a' } }, ['title'])).toBe(false)
    expect(touchesSearchFields(undefined, fields)).toBe(false)
  })
})
