import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/config.js')

const authenticationMocks = vi.hoisted(() => ({
  authenticationMiddleware: vi.fn(() => []),
  getUserInformation: vi.fn(() => ({
    email: `jb@example.com`,
    name: 'Joe Bloggs',
    organisation: 'Acme Corp',
  })),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({
  default: authenticationMocks,
}))

vi.mock('../../../src/utils/entity.js', async () => ({
  toEntity: vi.fn(() => 'user:userdn'),
}))

describe('routes > entities > getEntityLookup', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))
    const res = await testGet(`/api/v2/entity/userdn/lookup`)

    expect(res.statusCode).toBe(200)
    expect(authenticationMocks.getUserInformation.mock.calls).matchSnapshot()
    expect(res.body).matchSnapshot()
  })
})
