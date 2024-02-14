import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/v2/audit/__mocks__/index.js'
import { deleteAccessRequestSchema } from '../../../../src/routes/v2/model/accessRequest/deleteAccessRequest.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

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

  test('audit > expected call', async () => {
    vi.mock('../../../../src/services/v2/accessRequest.js', () => ({
      removeAccessRequest: vi.fn(() => ({ message: 'Successfully removed access request.' })),
    }))

    const fixture = createFixture(deleteAccessRequestSchema)
    const res = await testDelete(
      `/api/v2/model/${fixture.params.modelId}/access-request/${fixture.params.accessRequestId}`,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteAccessRequest).toBeCalled()
    expect(audit.onDeleteAccessRequest.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
