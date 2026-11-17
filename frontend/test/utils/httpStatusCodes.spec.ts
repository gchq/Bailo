// @vitest-environment node

import { getReasonPhrase } from 'utils/httpStatusCodes'
import { describe, expect, it } from 'vitest'

describe('getReasonPhrase', () => {
  it('returns the standard phrase for a status code', () => {
    expect(getReasonPhrase(200)).toBe('OK')
    expect(getReasonPhrase(404)).toBe('Not Found')
    expect(getReasonPhrase(500)).toBe('Internal Server Error')
  })

  it('throws for an unsupported status code', () => {
    expect(() => getReasonPhrase(999)).toThrow('Invalid status code: 999')
  })
})
