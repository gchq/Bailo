import { Request, Response } from 'express'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { escalateUser, isAuthorisedToEscalate } from '../../../src/routes/middleware/userEscalation.js'
import config from '../../../src/utils/config.js'

const mockTokenService = vi.hoisted(() => ({
  getTokenFromAuthHeader: vi.fn(),
}))

vi.mock('../../../src/services/token.js', () => mockTokenService)

describe('middleware > userEscalation', () => {
  beforeEach(() => {
    vi.spyOn(config, 'federation', 'get').mockReturnValue({
      id: 'localBailo',
      state: 'enabled',
      isEscalationEnabled: true,
      peers: {
        bailoWales: {
          state: 'enabled',
          baseUrl: 'http://welsh-bailo:8080',
          label: 'Bailo Wales Instance',
          kind: 'bailo',
          cache: {
            query: 60,
          },
          allowedSystemUserIds: ['system-user-1'],
        },
      },
    })
  })
  test('escalateUser > should escalate when system user is authorised', async () => {
    const next = vi.fn()

    const request = {
      header: vi.fn((name: string) => {
        const headers: Record<string, string> = {
          'x-user': 'app-user-1',
          'x-bailo-id': 'bailoWales',
        }
        return headers[name]
      }),
      user: { dn: 'system-user-1' },
    } as unknown as Request

    escalateUser(request, {} as Response, next)

    expect(request.user).toEqual({
      dn: 'app-user-1',
    })
    expect(next).toBeCalled()
  })
  test('escalateUser > should not escalate when system user is not authorised', async () => {
    const next = vi.fn()

    const request = {
      header: vi.fn((name: string) => {
        const headers: Record<string, string> = {
          'x-user': 'app-user-1',
          'x-bailo-id': 'bailoWales',
        }
        return headers[name]
      }),
      user: { dn: 'system-user-2' },
    } as unknown as Request

    escalateUser(request, {} as Response, next)

    expect(request.user).toEqual({
      dn: 'system-user-2',
    })

    expect(next).toBeCalled()
  })
  test('escalateUser > should not escalate when instance is not in allowed list', async () => {
    const next = vi.fn()

    const request = {
      header: vi.fn((name: string) => {
        const headers: Record<string, string> = {
          'x-user': 'app-user-1',
          'x-bailo-id': 'bailoScotland',
        }
        return headers[name]
      }),
      user: { dn: 'system-user-2' },
    } as unknown as Request

    escalateUser(request, {} as Response, next)

    expect(request.user).toEqual({
      dn: 'system-user-2',
    })

    expect(next).toBeCalled()
  })
})

// ------------------------------------------------------------------------------------------------------------------

describe('escalation > isAuthorisedToEscalate', () => {
  test('isAuthorisedToEscalate > should return true when the system user is in an allowed instance', () => {
    vi.spyOn(config, 'federation', 'get').mockReturnValue({
      id: 'localBailo',
      state: 'enabled',
      isEscalationEnabled: true,
      peers: {
        bailoWales: {
          state: 'enabled',
          baseUrl: 'http://welsh-bailo:8080',
          label: 'Bailo Wales Instance',
          kind: 'bailo',
          cache: {
            query: 60,
          },
          allowedSystemUserIds: ['system-user-1'],
        },
      },
    })
    expect(isAuthorisedToEscalate('system-user-1', 'bailoWales')).toBe(true)
  })
  test('isAuthorisedToEscalate > should return false when the system user is not in an allowed instance', () => {
    vi.spyOn(config, 'federation', 'get').mockReturnValue({
      id: 'localBailo',
      state: 'enabled',
      isEscalationEnabled: true,
      peers: {
        bailoWales: {
          state: 'enabled',
          baseUrl: 'http://welsh-bailo:8080',
          label: 'Bailo Wales Instance',
          kind: 'bailo',
          cache: {
            query: 60,
          },
          allowedSystemUserIds: ['system-user-1'],
        },
      },
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailoWales')).toBe(false)
  })
  test('isAuthorisedToEscalate > should return false when the instance is not in the allowed list', () => {
    vi.spyOn(config, 'federation', 'get').mockReturnValue({
      id: 'localBailo',
      state: 'enabled',
      isEscalationEnabled: true,
      peers: {
        bailoWales: {
          state: 'enabled',
          baseUrl: 'http://welsh-bailo:8080',
          label: 'Bailo Wales Instance',
          kind: 'bailo',
          cache: {
            query: 60,
          },
          allowedSystemUserIds: ['system-user-1'],
        },
      },
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailoScotland')).toBe(false)
  })
  test('isAuthorisedToEscalate > should return false when no instances are in the allowed list', () => {
    vi.spyOn(config, 'federation', 'get').mockReturnValue({
      id: 'localBailo',
      state: 'enabled',
      isEscalationEnabled: true,
      peers: {},
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailoScotland')).toBe(false)
  })
})
