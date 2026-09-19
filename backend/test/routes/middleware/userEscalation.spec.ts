import { Request, Response } from 'express'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { escalateUser, isAuthorisedToEscalate } from '../../../src/routes/middleware/userEscalation.js'
import config, { Config } from '../../../src/utils/config.js'
import { setTestConfig } from '../../testUtils/setupTestConfig.js'

const mockTokenService = vi.hoisted(() => ({
  getTokenFromAuthHeader: vi.fn(),
}))

vi.mock('../../../src/services/token.js', () => mockTokenService)

const federationConfig: Config['federation'] = {
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
}

function mockRequest(userDn: string, bailoId: string) {
  return {
    header: vi.fn((name: string) => {
      const headers: Record<string, string> = {
        'x-user': 'app-user-1',
        'x-bailo-id': bailoId,
      }
      return headers[name]
    }),
    user: { dn: userDn },
  } as unknown as Request
}

describe('middleware > userEscalation', () => {
  beforeEach(() => {
    setTestConfig({ federation: federationConfig })
  })

  test('escalateUser > should not escalate when escalation is not enabled', async () => {
    const next = vi.fn()
    setTestConfig({ federation: { isEscalationEnabled: false } })

    const request = mockRequest('system-user-1', 'bailoWales')

    escalateUser(request, {} as Response, next)

    expect(request.user).toEqual({
      dn: 'system-user-1',
    })
    expect(next).toHaveBeenCalled()
  })
  test('escalateUser > should escalate when system user is authorised', async () => {
    const next = vi.fn()

    const request = mockRequest('system-user-1', 'bailoWales')

    escalateUser(request, {} as Response, next)

    expect(request.user).toEqual({
      dn: 'app-user-1',
    })
    expect(next).toHaveBeenCalled()
  })
  test('escalateUser > should not escalate when system user is not authorised', async () => {
    const next = vi.fn()

    const request = mockRequest('system-user-2', 'bailoWales')

    escalateUser(request, {} as Response, next)

    expect(request.user).toEqual({
      dn: 'system-user-2',
    })

    expect(next).toHaveBeenCalled()
  })
  test('escalateUser > should not escalate when instance is not in allowed list', async () => {
    const next = vi.fn()

    const request = mockRequest('system-user-2', 'bailoScotland')

    escalateUser(request, {} as Response, next)

    expect(request.user).toEqual({
      dn: 'system-user-2',
    })

    expect(next).toHaveBeenCalled()
  })
})

// ------------------------------------------------------------------------------------------------------------------

describe('escalation > isAuthorisedToEscalate', () => {
  beforeEach(() => {
    setTestConfig({ federation: federationConfig })
  })

  test('isAuthorisedToEscalate > should return true when the system user is in an allowed instance', () => {
    expect(isAuthorisedToEscalate('system-user-1', 'bailoWales')).toBe(true)
  })
  test('isAuthorisedToEscalate > should return false when the system user is not in an allowed instance', () => {
    expect(isAuthorisedToEscalate('system-user-2', 'bailoWales')).toBe(false)
  })
  test('isAuthorisedToEscalate > should return false when the instance is not in the allowed list', () => {
    expect(isAuthorisedToEscalate('system-user-2', 'bailoScotland')).toBe(false)
  })
  test('isAuthorisedToEscalate > should return false when no instances are in the allowed list', () => {
    // Assigned directly rather than merged, so that the peers from `federationConfig` are removed
    config.federation.peers = {}
    expect(isAuthorisedToEscalate('system-user-2', 'bailoScotland')).toBe(false)
  })
})
