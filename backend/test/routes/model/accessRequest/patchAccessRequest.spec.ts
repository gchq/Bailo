import { describe, expect, test, vi } from 'vitest'

import { patchAccessRequestSchema } from '../../../../src/routes/v2/model/accessRequest/patchAccessRequest.js'
import { createFixture, testPatch } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

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

  test('400 > no name', async () => {
    const fixture = createFixture(patchAccessRequestSchema) as any

    delete fixture.body.metadata.overview.name
    const res = await testPatch(`/api/v2/model/anything/access-request/${fixture.params.accessRequestId}`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
