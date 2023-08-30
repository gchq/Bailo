import { describe, expect, test, vi } from 'vitest'

import { postFromSchemaSchema } from '../../../../src/routes/v2/model/modelcard/postFromSchema.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

describe('routes > model > postModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/v2/model.js', () => ({
      createModelCardFromSchema: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(postFromSchemaSchema)
    const res = await testPost('/api/v2/model/example/setup/from-schema', fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('400 > no description', async () => {
    const fixture = createFixture(postFromSchemaSchema) as any

    // This model does not include a description.
    delete fixture.body.schemaId

    const res = await testPost('/api/v2/model/example/setup/from-schema', fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
