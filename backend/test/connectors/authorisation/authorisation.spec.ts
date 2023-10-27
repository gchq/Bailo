import { describe, expect, test, vi } from 'vitest'

import { getAuthorisationConnector } from '../../../src/connectors/v2/authorisation/index.js'

const configMock = vi.hoisted(() => ({
  connectors: {
    authorisation: {
      kind: 'silly',
    },
  },
}))
vi.mock('../../../src/utils/v2/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

vi.mock('../../../src/connectors/v2/authentication/index.js', () => ({
  default: {
    getUserModelRoles: vi.fn(),
  },
}))

describe('connectors > authorisation', () => {
  test('silly', () => {
    const connector = getAuthorisationConnector(false)
    expect(connector.constructor.name).toBe('SillyAuthorisationConnector')
  })

  test('invalid', () => {
    configMock.connectors.authorisation.kind = 'invalid'

    expect(() => getAuthorisationConnector(false)).toThrowError('No valid authorisation connector provided.')
  })
})
