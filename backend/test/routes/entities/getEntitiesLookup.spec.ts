import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')

const authenticationMocks = vi.hoisted(() => ({
  authenticationMiddleware: vi.fn(() => []),
  getMultipleUsersInformation: vi.fn(() => [
    {
      email: `joeb@example.com`,
      name: 'Joe Bloggs',
      organisation: 'Acme Corp',
    },
    {
      email: `janeb@example.com`,
      name: 'Jane Bloggs',
      organisation: 'Acme Corp',
    },
  ]),
}))
vi.mock('../../../src/connectors/authentication/index.js', async () => ({
  default: authenticationMocks,
}))

vi.mock('../../../src/utils/entity.js', async () => ({
  toEntity: vi.fn(() => 'user:userdn'),
}))

describe('routes > entities > getEntitiesLookup', () => {
  test('200 > ok', async () => {
    const res = await testGet(`/api/v2/entities/lookup?dnList=user1&dnList=user2`)

    expect(res.statusCode).toBe(200)
    expect(authenticationMocks.getMultipleUsersInformation.mock.calls).matchSnapshot()
    expect(res.body).matchSnapshot()
  })
})
