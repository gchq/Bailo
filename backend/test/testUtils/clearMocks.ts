import { beforeEach, vi } from 'vitest'

import { resetAuthMock } from '../../src/connectors/authorisation/__mocks__/index.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetAllMocks()
  resetAuthMock()
})
