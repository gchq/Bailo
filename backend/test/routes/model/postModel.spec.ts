import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { postModelSchema } from '../../../src/routes/v2/model/postModel.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > postModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      createModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(postModelSchema)
    const res = await testPost('/api/v2/models', fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      createModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(postModelSchema)
    const res = await testPost('/api/v2/models', fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateModel).toBeCalled()
    expect(audit.onCreateModel.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('400 > no description', async () => {
    const fixture = createFixture(postModelSchema) as any

    // This model does not include a description.
    delete fixture.body.description

    const res = await testPost('/api/v2/models', fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })

  test('400 > URL encoding in collaborator entity', async () => {
    const fixture = createFixture(postModelSchema)
    fixture.body.collaborators = [{ entity: 'name:test%20name', roles: ['owner'] }]
    const res = await testPost(`/api/v2/models`, fixture)
    expect(res.statusCode).toEqual(400)
    expect(res.body.error.message).toEqual(
      'Path: body.collaborators[0].entity - Message: Please remove URL Encoding from collaborator entity string',
    )
  })
})
