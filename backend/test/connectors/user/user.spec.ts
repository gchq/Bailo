import { describe, expect, test, vi } from 'vitest'

import { getUserConnector } from '../../../src/connectors/v2/user/index.js'

const configMock = vi.hoisted(() => ({
  connectors: {
    user: {
      kind: 'silly',
    },
  },
}))
vi.mock('../../../src/utils/v2/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

describe('connectors > user', () => {
  test('silly', () => {
    const connector = getUserConnector(false)
    expect(connector.constructor.name).toBe('SillyUserConnector')
  })

  test('invalid', () => {
    configMock.connectors.user.kind = 'invalid'

    expect(() => getUserConnector(false)).toThrowError('No valid user connector provided.')
  })
})
