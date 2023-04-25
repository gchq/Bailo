import { NextFunction, Request, Response } from 'express'
import { describe, expect, test, vi } from 'vitest'

import * as approval from '../../services/approval.js'
import { testUser } from '../../utils/test/testModels.js'
import { authenticatedGetRequest } from '../../utils/test/testUtils.js'

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

describe('test approvals routes', () => {
  test('that we can fetch approvals count', async () => {
    vi.spyOn(approval, 'readNumApprovals').mockResolvedValue(1)

    const res = await authenticatedGetRequest('/api/v1/approvals/count')
    expect(res.body.count).toBe(1)
  })
})
