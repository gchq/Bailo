import { describe, expect, test } from 'vitest'

import { deepFreeze, getPropValue } from '../../src/utils/object.js'

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
})
