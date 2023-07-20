import { describe, expect, test } from 'vitest'

import { bailoErrorGuard } from '../../src/middleware/expressErrorHandler.js'

describe('middleware > expressErrorHandler', () => {
  test('bailoErrorGuard', () => {
    const error = { code: 500 }
    expect(bailoErrorGuard(error)).toBe(true)

    expect(bailoErrorGuard(undefined)).toBe(false)
    expect(bailoErrorGuard({})).toBe(false)
    expect(bailoErrorGuard({ code: 999 })).toBe(false)
  })
})
