import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { postMigrateModelSchemaSchema } from '../../../src/routes/v2/model/postMigrateModelSchema.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > postModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/schemaMigration.js', () => ({
      runModelSchemaMigration: vi.fn(() => ({ _id: 'test', id: 'test-model=', card: {} })),
    }))

    const fixture = createFixture(postMigrateModelSchemaSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/migrate-schema/${fixture.params.migrationId}`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../src/services/schemaMigration.js', () => ({
      runModelSchemaMigration: vi.fn(() => ({ _id: 'test', id: 'test-model=', card: {} })),
    }))

    const fixture = createFixture(postMigrateModelSchemaSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/migrate-schema/${fixture.params.migrationId}`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateModel).toBeCalled()
    expect(audit.onUpdateModel.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
