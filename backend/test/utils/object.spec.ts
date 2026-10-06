import { describe, expect, test } from 'vitest'

import { deepFreeze, deepMergePreferFirst, getPropValue } from '../../src/utils/object.js'

describe('utils > object', () => {
  test('deepFreeze', () => {
    const obj: any = {
      a: 1,
      b: { c: 2 },
      d() {
        return 3
      },
    }
    const frozen = deepFreeze(obj)

    expect(Object.isFrozen(frozen)).toBe(true)
    expect(Object.isFrozen(frozen.b)).toBe(true)

    expect(() => {
      frozen.a = 10
    }).toThrow()

    expect(() => {
      frozen.b.c = 20
    }).toThrow()
  })

  test('getPropValue', () => {
    const source = {
      a: {
        b: {
          c: 42,
        },
      },
    }

    expect(getPropValue(source, 'a.b.c')).toBe(42)
    expect(getPropValue(source, 'a.b')).toStrictEqual({ c: 42 })
    expect(getPropValue(source, 'a.x.c')).toBeUndefined()
    expect(getPropValue(source, '')).toStrictEqual(source)
    expect(getPropValue(source, '   ')).toStrictEqual(source)
  })

  describe('deepMergePreferFirst', () => {
    test('first object primitives win over second', () => {
      expect(deepMergePreferFirst({ a: 'first' }, { a: 'second', b: 'only-second' })).toStrictEqual({
        a: 'first',
        b: 'only-second',
      })
    })

    test('first object arrays win completely', () => {
      expect(deepMergePreferFirst({ tags: ['a'] }, { tags: ['b', 'c'] })).toStrictEqual({ tags: ['a'] })
    })

    test('deeply merges nested objects', () => {
      expect(
        deepMergePreferFirst(
          { overview: { name: 'local' } },
          { overview: { name: 'mirrored', description: 'mirrored-desc' } },
        ),
      ).toStrictEqual({ overview: { name: 'local', description: 'mirrored-desc' } })
    })

    test('fills in keys missing from first object', () => {
      expect(deepMergePreferFirst({}, { a: 1, nested: { b: 2 } })).toStrictEqual({ a: 1, nested: { b: 2 } })
    })

    test('handles null values in first object', () => {
      expect(deepMergePreferFirst({ a: null }, { a: 'fallback' })).toStrictEqual({ a: null })
    })

    test('does not mutate input objects', () => {
      const first = { a: 1 }
      const second = { b: 2 }
      deepMergePreferFirst(first, second)
      expect(first).toStrictEqual({ a: 1 })
      expect(second).toStrictEqual({ b: 2 })
    })
  })
})
