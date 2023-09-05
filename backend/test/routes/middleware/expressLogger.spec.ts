import Logger from 'bunyan'
import { describe, expect, test, vi } from 'vitest'

import { expressLogger } from '../../../src/routes/middleware/expressLogger.js'

describe('middleware > expressLogger', () => {
  test('middleware', async () => {
    vi.mock('util', () => ({
      promisify: vi.fn(() => vi.fn()),
    }))

    const req: any = {
      headers: { 'x-request-id': '' },
      socket: { remoteAddress: '127.0.0.1' },
    }

    const res: any = {
      setHeader: vi.fn(),
    }

    await new Promise((resolve) => {
      expressLogger(req, res, resolve)
    })

    expect(req.reqId).not.equal('')
    expect(req.log instanceof Logger).toBe(true)
  })
})
