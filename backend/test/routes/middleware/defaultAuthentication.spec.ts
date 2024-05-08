import { Request, Response } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { checkAuthentication, getTokenFromAuthHeader } from '../../../src/routes/middleware/defaultAuthentication.js'

const mockTokenService = vi.hoisted(() => ({
  getTokenFromAuthHeader: vi.fn(),
}))
vi.mock('../../../src/services/token.js', () => mockTokenService)

describe('middleware > defaultAuthentication', () => {
  test('getTokenFromAuthHeader > missing header', async () => {
    const request = {
      get: vi.fn(),
    } as any
    const next = vi.fn()

    getTokenFromAuthHeader(request, {} as Response, next)

    expect(request.user).toBe(undefined)
    expect(next).toBeCalled()
  })

  test('getTokenFromAuthHeader > valid authentication', async () => {
    const request = {
      get: vi.fn(() => 'auth header'),
    } as any
    const next = vi.fn()
    const token = { user: 'test' }
    mockTokenService.getTokenFromAuthHeader.mockReturnValueOnce(token)

    await getTokenFromAuthHeader(request, {} as Response, next)

    expect(request.user.token).toEqual(token)
    expect(request.user).toEqual({ dn: token.user, token })
    expect(next).toBeCalled()
  })

  test('checkAuthentication > valid authentication', async () => {
    const request = {
      user: 'test',
      log: {
        debug: vi.fn(),
      },
    } as Request
    const next = vi.fn()

    checkAuthentication(request, {} as Response, next)

    expect(next).toBeCalled()
  })

  test('checkAuthentication > missing authentication', async () => {
    const request = {} as Request
    const next = vi.fn()

    const func = () => checkAuthentication(request, {} as Response, next)

    expect(func).toThrowError('No valid authentication provided')
    expect(next).not.toBeCalled()
  })
})
