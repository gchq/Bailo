import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postFromTemplateSchema } from '../../../../src/routes/v2/model/modelcard/postFromTemplate.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/authorisation/index.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/model.js', async () => {
  const actual = (await vi.importActual('../../../../src/services/model.js')) as object
  return {
    ...actual,
    createModelCardFromTemplate: vi.fn(() => ({ _id: 'test' })),
  }
})

describe('routes > model > postModel > template', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postFromTemplateSchema)
    const res = await testPost('/api/v2/model/example/setup/from-template', fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postFromTemplateSchema)
    const res = await testPost('/api/v2/model/example/setup/from-template', fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateModelCard).toBeCalled()
    expect(audit.onCreateModelCard.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onCreateModelCard.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })

  test('400 > no model template ID provided', async () => {
    const fixture = createFixture(postFromTemplateSchema) as any

    delete fixture.body.templateId

    const res = await testPost('/api/v2/model/example/setup/from-template', fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
