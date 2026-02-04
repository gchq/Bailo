import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  escalateUserIfAuthorised,
  generateEscalationHeaders,
  isAuthorisedToEscalate,
} from '../../src/services/escalation.js'
import config from '../../src/utils/config.js'

describe('escalation > isAuthorisedToEscalate', () => {
  test('isAuthorisedToEscalate > should return true when the system user is in an allowed instance', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
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
      isEnabled: true,
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailo-instance-1')).toBe(false)
  })
  test('isAuthorisedToEscalate > should return false when the instance is not in the allowed list', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: ['system-user-1'],
        },
      ],
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailo-instance-2')).toBe(false)
  })
  test('isAuthorisedToEscalate > should return false when no instances are in the allowed list', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
      allowed: [],
    })
    expect(isAuthorisedToEscalate('system-user-2', 'bailo-instance-2')).toBe(false)
  })
})

describe('escalation > escalateUserIfAuthorised', () => {
  test('escalateUserIfAuthorised > should escalate when system user is authorised', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
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
      user: { dn: 'system-user-1' },
    }
    const result = escalateUserIfAuthorised(req as any)
    expect(result.user).toEqual({
      dn: 'app-user-1',
    })
  })
  test('escalateUserIfAuthorised > should not escalate when system user is not authorised', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
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
      user: { dn: 'system-user-2' },
    }
    const result = escalateUserIfAuthorised(req as any)
    expect(result.user).toEqual({
      dn: 'system-user-2',
    })
  })
  test('escalateUserIfAuthorised > should not escalate when instance is not in allowed list', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
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
      user: { dn: 'system-user-2' },
    }
    const result = escalateUserIfAuthorised(req as any)
    expect(result.user).toEqual({
      dn: 'system-user-2',
    })
  })
})

describe('escalation > generateEscalationHeaders', () => {
  beforeEach(() => {
    vi.spyOn(config, 'federation', 'get').mockReturnValue({
      id: 'bailo-instance-1',
      state: 'enabled',
      peers: new Map([
        [
          'bailo',
          {
            state: 'enabled',
            baseUrl: 'https://bailo.com',
            label: 'Bailo 2',
            kind: 'bailo',
          },
        ],
      ]),
    })
  })
  test('generateEscalationHeaders > should generate escalation headers when escalation is enabled', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: [''],
        },
      ],
    })
    expect(generateEscalationHeaders('app-user-1')).toEqual(
      new Headers({
        'x-user': 'app-user-1',
        'x-bailo-id': 'bailo-instance-1',
      }),
    )
  })
  test('generateEscalationHeaders > should not generate escalation headers when escalation is not enabled', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: false,
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: [''],
        },
      ],
    })
    expect(generateEscalationHeaders('app-user-1')).toEqual(
      new Headers({
        'x-bailo-id': 'bailo-instance-1',
      }),
    )
  })
  test('generateEscalationHeaders > should not generate escalation headers when given user is empty string', () => {
    vi.spyOn(config, 'escalation', 'get').mockReturnValue({
      isEnabled: true,
      allowed: [
        {
          instanceId: 'bailo-instance-1',
          userIds: [''],
        },
      ],
    })
    expect(generateEscalationHeaders('')).toEqual(
      new Headers({
        'x-bailo-id': 'bailo-instance-1',
      }),
    )
  })
})
