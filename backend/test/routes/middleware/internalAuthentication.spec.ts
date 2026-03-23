import { describe, expect, test, vi } from 'vitest'

import { internalServiceAuth } from '../../../src/routes/middleware/internalAuthentication.js'

describe('middleware > internalAuthentication', () => {
  test('internalServiceAuth > valid authentication', async () => {
    const request = {
      socket: {
        authorized: true,
        getPeerCertificate: vi.fn(() => ({ subject: { CN: 'test CN' } })),
      },
    }
    const next = vi.fn()

    internalServiceAuth(request as any, {} as any, next)

    expect(next).toBeCalled()
  })

  test('internalServiceAuth > not authorized', async () => {
    const request = { socket: { authorized: false } }
    const next = vi.fn()

    const func = () => internalServiceAuth(request as any, {} as any, next)

    expect(func).toThrowError('Client certificate not authorised by CA')
    expect(next).not.toBeCalled()
  })

  test('internalServiceAuth > missing cert', async () => {
    const request = {
      socket: {
        authorized: true,
        getPeerCertificate: vi.fn(() => ({})),
      },
    }
    const next = vi.fn()

    const func = () => internalServiceAuth(request as any, {} as any, next)

    expect(func).toThrowError('Client certificate missing subject CN')
    expect(next).not.toBeCalled()
  })

  test('internalServiceAuth > array of CNs', async () => {
    const request = {
      socket: {
        authorized: true,
        getPeerCertificate: vi.fn(() => ({ subject: { CN: ['test CN'] } })),
      },
    }
    const next = vi.fn()

    const func = () => internalServiceAuth(request as any, {} as any, next)

    expect(func).toThrowError('Multiple CNs in certificate are not permitted')
    expect(next).not.toBeCalled()
  })

  test('internalServiceAuth > missing CN', async () => {
    const request = {
      socket: {
        authorized: true,
        getPeerCertificate: vi.fn(() => ({ subject: { CN: 'bad CN' } })),
      },
    }
    const next = vi.fn()

    const func = () => internalServiceAuth(request as any, {} as any, next)

    expect(func).toThrowError('Client certificate CN not permitted: bad CN')
    expect(next).not.toBeCalled()
  })
})
