import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { bailoErrorGuard, expressErrorHandler } from '../../../src/routes/middleware/expressErrorHandler.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/connectors/audit/index.js')

describe('middleware > expressErrorHandler', () => {
  test('bailoErrorGuard', () => {
    const error = { code: 500 }
    expect(bailoErrorGuard(error)).toBe(true)

    expect(bailoErrorGuard(undefined)).toBe(false)
    expect(bailoErrorGuard({})).toBe(false)
    expect(bailoErrorGuard({ code: 999 })).toBe(false)
  })

  test('bad error', async () => {
    const req: any = {}
    const res: any = {}

    await expect(() => expressErrorHandler({}, req, res, vi.fn() as any)).rejects.toThrow()
  })

  test('good error', async () => {
    const error = { code: 299, name: 'test', message: 'message', context: { fake: true } }
    const req: any = { log: { warn: vi.fn() } }

    const json = vi.fn()
    const res: any = { status: vi.fn(() => ({ json })) }
    await expressErrorHandler(error, req, res, vi.fn() as any)

    expect(res.status).toBeCalledWith(error.code)
    expect(json).toBeCalled()
    expect(json.mock.calls.at(-1)).toMatchSnapshot()
  })

  test('audit > expected call', async () => {
    const error = { code: 299, name: 'test', message: 'message', context: { fake: true } }
    const req: any = { log: { warn: vi.fn() } }

    const json = vi.fn()
    const res: any = { status: vi.fn(() => ({ json })) }
    await expressErrorHandler(error, req, res, vi.fn() as any)

    expect(audit.onError).toBeCalled()
    expect(audit.onError.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
