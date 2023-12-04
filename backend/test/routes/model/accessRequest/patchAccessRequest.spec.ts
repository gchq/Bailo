import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/v2/audit/__mocks__/index.js'
import { patchAccessRequestSchema } from '../../../../src/routes/v2/model/accessRequest/patchAccessRequest.js'
import { createFixture, testPatch } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')

vi.mock('../../../../src/services/v2/accessRequest.js', async () => {
  const actual = (await vi.importActual('../../../../src/services/v2/accessRequest.js')) as object
  return {
    ...actual,
    updateAccessRequest: vi.fn(() => ({ _id: 'test' })),
  }
})

describe('routes > accessRequest > patchAccessRequest', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(patchAccessRequestSchema)
    const res = await testPatch(`/api/v2/model/anything/access-request/${fixture.params.accessRequestId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(patchAccessRequestSchema)
    const res = await testPatch(`/api/v2/model/anything/access-request/${fixture.params.accessRequestId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateAccessRequest).toBeCalled()
    expect(audit.onUpdateAccessRequest.mock.calls.at(0).at(1)).toMatchSnapshot()
  })

  test('400 > no name', async () => {
    const fixture = createFixture(patchAccessRequestSchema) as any

    delete fixture.body.metadata.overview.name
    const res = await testPatch(`/api/v2/model/anything/access-request/${fixture.params.accessRequestId}`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
