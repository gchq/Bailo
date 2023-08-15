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
  test('silly', async () => {
    const connector = await getUserConnector(false)
    expect(connector.constructor.name).toBe('SillyUserConnector')
  })

  test('invalid', async () => {
    configMock.connectors.user.kind = 'invalid'

    expect(() => getUserConnector(false)).rejects.toThrowError('No valid user connector provided.')
  })
})
