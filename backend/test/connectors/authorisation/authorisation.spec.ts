import { describe, expect, test, vi } from 'vitest'

import { getAuthorisationConnector } from '../../../src/connectors/authorisation/index.js'
import config from '../../../src/utils/__mocks__/config.js'

vi.mock('../../../src/utils/v2/config.js')

vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: {
    getUserModelRoles: vi.fn(),
  },
}))

describe('connectors > authorisation', () => {
  test('basic', () => {
    const connector = getAuthorisationConnector(false)
    expect(connector.constructor.name).toBe('BasicAuthorisationConnector')
  })

  test('invalid', () => {
    const invalidConnector = 'invalid'
    config.connectors.authorisation.kind = invalidConnector

    expect(() => getAuthorisationConnector(false)).toThrowError(
      `'${invalidConnector}' is not a valid authorisation kind.`,
    )
  })
})
