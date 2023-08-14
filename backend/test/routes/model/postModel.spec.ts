// Some bad parts
import '../../../src/utils/test/testUtils.js'

import { describe, expect, test, vi } from 'vitest'

import { postModelSchema } from '../../../src/routes/v2/model/postModel.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

describe('routes > model > postModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/v2/model.js', () => ({
      createModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(postModelSchema)
    const res = await testPost('/api/v2/models', fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('400 > no description', async () => {
    const fixture = createFixture(postModelSchema) as any

    // This model does not include a description.
    delete fixture.body.description

    const res = await testPost('/api/v2/models', fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
