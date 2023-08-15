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

describe('connectors > authorisation', () => {
  test('silly', async () => {
    const connector = await getAuthorisationConnector(false)
    expect(connector.constructor.name).toBe('SillyAuthorisationConnector')
  })

  test('invalid', async () => {
    configMock.connectors.authorisation.kind = 'invalid'

    expect(() => getAuthorisationConnector(false)).rejects.toThrowError('No valid authorisation connector provided.')
  })
})
