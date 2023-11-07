import { describe, expect, test, vi } from 'vitest'

import { getAuthorisationConnector } from '../../../src/connectors/v2/authorisation/index.js'
import config from '../../../src/utils/v2/__mocks__/config.js'

vi.mock('../../../src/utils/v2/config.js')

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
    config.connectors.authorisation.kind = 'invalid'

    expect(() => getAuthorisationConnector(false)).toThrowError('No valid authorisation connector provided.')
  })
})
