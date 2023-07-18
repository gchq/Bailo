// Some bad parts
import '../../../utils/test/testUtils.js'

import { describe, expect, test, vi } from 'vitest'

import { createFixture, testPost } from '../../../utils/v2/test/routes.js'
import { postModelSchema } from './postModel.js'

describe('routes > model > postModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../services/v2/model.js', () => ({
      createModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(postModelSchema)
    const res = await testPost('/api/v2/model', fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('400 > no description', async () => {
    const fixture = createFixture(postModelSchema) as any

    // This model does not include a description.
    delete fixture.body.description

    const res = await testPost('/api/v2/model', fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
