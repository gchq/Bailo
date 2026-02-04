import { describe, expect, test, vi } from 'vitest'

import { escalateUserIfAuthorised, isAuthorisedToEscalate } from '../../src/services/escalation.js'
import config from '../../src/utils/config.js'

describe('escalation > isAuthorisedToEscalate', () => {
  test('isAuthorisedToEscalate > should return true when the system user is in an allowed instance', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    expect(isAuthorisedToEscalate('system-user-1', 'bailo-instance-1')).toBe(true)
  })
  test('isAuthorisedToEscalate > should return false when the system user is not in an allowed instance', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailo-instance-1')).toBe(true)
  })
  test('isAuthorisedToEscalate > should return false when the instance is not in the allowed list', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailo-instance-2')).toBe(true)
  })
  test('isAuthorisedToEscalate > should return false when no instances are in the allowed list', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      allowed: [],
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailo-instance-2')).toBe(true)
  })
})

describe('escalation > escalateUserIfAuthorised', () => {
  test('isAuthorisedToEscalate > should escalate when system user is authorised', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    const req = {
      headers: {
        'x-user': 'app-user-1',
        'x-bailo-id': 'bailo-instance-1',
      },
      user: 'system-user-1',
    }
    const result = escalateUserIfAuthorised(req as any)
    expect(result.user).toEqual({
      dn: 'app-user-1',
    })
  })
  test('isAuthorisedToEscalate > should not escalate when system user is not authorised', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    const req = {
      headers: {
        'x-user': 'app-user-1',
        'x-bailo-id': 'bailo-instance-1',
      },
      user: 'system-user-2',
    }
    const result = escalateUserIfAuthorised(req as any)
    expect(result.user).toEqual({
      dn: 'system-user-2',
    })
  })
  test('isAuthorisedToEscalate > should not escalate when instance is not in allowed list', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    const req = {
      headers: {
        'x-user': 'app-user-1',
        'x-bailo-id': 'bailo-instance-2',
      },
      user: 'system-user-2',
    }
    const result = escalateUserIfAuthorised(req as any)
    expect(result.user).toEqual({
      dn: 'system-user-2',
    })
  })
})
