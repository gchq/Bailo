import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockAuth = vi.hoisted(() => ({
  authenticationMiddleware: vi.fn(() => [
    {
      path: '/',
      middleware: (req: any, _res: any, next: any) => {
        req.user = { dn: 'test-user' }
        next()
      },
    },
  ]),
  hasRole: vi.fn(),
}))

vi.mock('../../../../src/connectors/authentication/index.js', () => ({
  default: mockAuth,
}))

describe('routes > v3 > entities > getCurrentUser', () => {
  test('200 > returns user with no systemRoles when user has neither Admin nor Compliance', async () => {
    mockAuth.hasRole.mockResolvedValue(false)

    const res = await testGet('/api/v3/entities/me')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      user: { dn: 'test-user', systemRoles: [] },
    })
  })

  test('200 > returns user with systemRoles containing admin when user is Admin', async () => {
    mockAuth.hasRole.mockImplementation((_user: any, role: string) => Promise.resolve(role === 'admin'))

    const res = await testGet('/api/v3/entities/me')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      user: { dn: 'test-user', systemRoles: ['admin'] },
    })
  })

  test('200 > returns user with systemRoles containing compliance when user is Compliance', async () => {
    mockAuth.hasRole.mockImplementation((_user: any, role: string) => Promise.resolve(role === 'compliance'))

    const res = await testGet('/api/v3/entities/me')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      user: { dn: 'test-user', systemRoles: ['compliance'] },
    })
  })

  test('200 > returns user with both admin and compliance systemRoles when user has both roles', async () => {
    mockAuth.hasRole.mockResolvedValue(true)

    const res = await testGet('/api/v3/entities/me')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      user: { dn: 'test-user', systemRoles: ['admin', 'compliance'] },
    })
  })

  test('audit > expected call', async () => {
    const res = await testGet('/api/v3/entities/me')

    expect(res.statusCode).toBe(200)
    expect(audit.onViewCurrentUserInformation).toHaveBeenCalled()
    expect(audit.onViewCurrentUserInformation.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
