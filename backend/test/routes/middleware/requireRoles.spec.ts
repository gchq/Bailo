import { NextFunction, Request, Response } from 'express'
import { describe, expect, test, vi } from 'vitest'

import { Roles } from '../../../src/connectors/authentication/constants.js'
import { requireRole, requireRoles } from '../../../src/routes/middleware/requireRoles.js'
import { Forbidden, Unauthorized } from '../../../src/utils/error.js'

const mockAuthentication = vi.hoisted(() => ({
  hasRole: vi.fn(),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({ default: mockAuthentication }))

describe('middleware > requireRoles', () => {
  const next: NextFunction = vi.fn()
  const res = {} as Response

  test('requireRole > 401 if user is not present', async () => {
    const req = {} as Request

    const middleware = requireRole(Roles.Admin)

    await expect(middleware(req, res, next)).rejects.toThrowError(Unauthorized('No valid authentication provided.'))
  })

  test('requireRoles > 403 if user does not have required role', async () => {
    const req = {
      user: { dn: 'test-user' },
    } as unknown as Request
    mockAuthentication.hasRole.mockResolvedValue(false)

    const middleware = requireRoles([Roles.Admin])

    await expect(middleware(req, res, next)).rejects.toThrowError(
      Forbidden('You do not have the required role.', {
        userDn: req.user.dn,
        requiredRole: Roles.Admin,
      }),
    )
  })

  test('requireRole > success calls next', async () => {
    const req = {
      user: { dn: 'admin-user' },
    } as unknown as Request
    mockAuthentication.hasRole.mockResolvedValue(true)

    const middleware = requireRole(Roles.Admin)
    await middleware(req, res, next)

    expect(mockAuthentication.hasRole).toHaveBeenCalledWith(req.user, Roles.Admin)
    expect(next).toHaveBeenCalledWith()
  })
})
