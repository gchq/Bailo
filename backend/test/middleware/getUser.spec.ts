import { describe, expect, test, vi } from 'vitest'

import { getUser } from '../../src/middleware/getUser.js'

const getUserFromReq = vi.hoisted(() => vi.fn(() => ({ dn: 'default' } as any)))
vi.mock('../../src/connectors/v2/user/index.js', () => ({
  default: {
    getUserFromReq,
  },
}))

describe('middleware > getUser', () => {
  test('resolves user', async () => {
    const req: any = {}
    const res: any = {}
    getUserFromReq.mockResolvedValueOnce({ dn: 'test' })

    await new Promise((resolve) => {
      getUser(req, res, resolve)
    })

    expect(req.user).toStrictEqual({ dn: 'test' })
  })

  test('resolves user', async () => {
    const req: any = {}
    const res: any = {}
    getUserFromReq.mockResolvedValueOnce(undefined)

    await new Promise((resolve) => {
      getUser(req, res, resolve)
    })

    expect(req.user).toStrictEqual(undefined)
  })
})
