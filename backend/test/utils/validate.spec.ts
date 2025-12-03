import { describe, expect, test } from 'vitest'
import z from 'zod'

import { coerceArray, parse, strictCoerceBoolean } from '../../src/utils/validate.js'

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

  test('strictCoerceBoolean', () => {
    const schema = z.object({
      a: strictCoerceBoolean(z.boolean()),
    })

    expect(parse({ a: 'true' } as any, schema)).toStrictEqual({ a: true })
    expect(parse({ a: 'false' } as any, schema)).toStrictEqual({ a: false })
    expect(() => parse({ a: '' } as any, schema)).toThrow()
    expect(() => parse({ a: '0' } as any, schema)).toThrow()
    expect(() => parse({ a: 'TRUE' } as any, schema)).toThrow()
  })
})
