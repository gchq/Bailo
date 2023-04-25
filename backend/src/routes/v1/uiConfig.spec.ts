import { NextFunction, Request, Response } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { testUser } from '../../utils/test/testModels.js'
import { authenticatedGetRequest, validateTestRequest } from '../../utils/test/testUtils.js'

vi.mock('../../utils/user.js', () => {
  return {
    getUser: vi.fn((req: Request, _res: Response, next: NextFunction) => {
      req.user = testUser
      next()
    }),
    ensureUserRole: vi.fn(() => {
      return vi.fn((req: Request, _res: Response, next: NextFunction) => {
        console.log('called')
        next()
      })
    }),
  }
})

describe('test UI config routes', () => {
  test('that we can fetch the correct UI config', async () => {
    const res = await authenticatedGetRequest('/api/v1/config/ui')
    const data = JSON.parse(res.text)
    validateTestRequest(res)
    expect(data.banner).not.toBe(undefined)
    expect(data.registry).not.toBe(undefined)
  })
})
