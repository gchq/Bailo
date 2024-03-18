import { describe, expect, test } from 'vitest'
import z from 'zod'

import { coerceArray, parse } from '../../src/utils/validate.js'

describe('utils > validate', () => {
  test('parse', () => {
    const schema = z.object({
      a: z.string(),
      b: z.string(),
    })

    expect(parse({ a: 'a', b: 'b' } as any, schema)).toStrictEqual({ a: 'a', b: 'b' })
    expect(() => parse({ a: 'a' } as any, schema)).toThrow()
  })

  test('coerceArray', () => {
    const schema = z.object({
      a: coerceArray(z.array(z.string())),
    })

    expect(parse({ a: 'a' } as any, schema)).toStrictEqual({ a: ['a'] })
    expect(parse({ a: ['a'] } as any, schema)).toStrictEqual({ a: ['a'] })
    expect(parse({ a: ['a', 'b'] } as any, schema)).toStrictEqual({ a: ['a', 'b'] })
    expect(() => parse({ a: undefined } as any, schema)).toThrow()
    expect(() => parse({ a: 2 } as any, schema)).toThrow()
    expect(() => parse({ a: [2] } as any, schema)).toThrow()
  })
})
