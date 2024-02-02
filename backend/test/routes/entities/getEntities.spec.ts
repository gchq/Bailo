import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/v2/config.js')

const authenticationMocks = vi.hoisted(() => ({
  authenticationMiddleware: vi.fn(() => []),
  queryEntities: vi.fn(() => [
    {
      kind: 'user',
      entities: ['user:alice'],
    },
    {
      kind: 'group',
      entities: ['group:alicesGroup'],
    },
  ]),
}))
vi.mock('../../../src/connectors/v2/authentication/index.js', async () => ({
  default: authenticationMocks,
}))

describe('routes > entities > getEntities', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/v2/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))

    const res = await testGet(`/api/v2/entities?q=bob`)

    expect(res.statusCode).toBe(200)
    expect(authenticationMocks.queryEntities.mock.calls).matchSnapshot()
    expect(res.body).matchSnapshot()
  })
})
