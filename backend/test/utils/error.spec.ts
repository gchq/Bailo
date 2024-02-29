import { describe, expect, test } from 'vitest'

import { BadReq, Forbidden, GenericError, NotFound, Unauthorized } from '../../src/utils/v2/error.js'

describe('utils > error', () => {
  test('GenericError', () => {
    const error = GenericError(999, 'Example Message', { example: 'context' })

    expect(JSON.stringify(error, null, 4)).toMatchSnapshot()
    expect(error.message).toMatchSnapshot()
  })

  test('BadReq', () => {
    const error = BadReq('example')
    expect(error.code).toBe(400)
  })

  test('Unauthorized', () => {
    const error = Unauthorized('example')
    expect(error.code).toBe(401)
  })

  test('Forbidden', () => {
    const error = Forbidden('example')
    expect(error.code).toBe(403)
  })

  test('NotFound', () => {
    const error = NotFound('example')
    expect(error.code).toBe(404)
  })
})
