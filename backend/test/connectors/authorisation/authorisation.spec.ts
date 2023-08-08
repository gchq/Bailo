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
  test('silly', () => {
    const connector = getAuthorisationConnector()
    expect(connector.constructor.name).toBe('SillyAuthorisationConnector')
  })
})
