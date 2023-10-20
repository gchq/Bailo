import { describe, expect, test, vi } from 'vitest'

import { deleteAccessRequestSchema } from '../../../../src/routes/v2/model/accessRequest/deleteAccessRequest.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

describe('routes > accessRequest > deleteAccessRequest', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/v2/accessRequest.js', () => ({
      removeAccessRequest: vi.fn(() => ({ message: 'Successfully removed access request.' })),
    }))

    const fixture = createFixture(deleteAccessRequestSchema)
    const res = await testDelete(
      `/api/v2/model/${fixture.params.modelId}/access-request/${fixture.params.accessRequestId}`,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
