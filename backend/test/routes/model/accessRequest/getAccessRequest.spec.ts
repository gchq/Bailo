import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import AccessRequestModel from '../../../../src/models/AccessRequest.js'
import { getAccessRequestSchema } from '../../../../src/routes/v2/model/accessRequest/getAccessRequest.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'
import { testAccessRequest } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

const accessRequestMock = vi.hoisted(() => {
  return {
    getAccessRequestById: vi.fn(() => undefined as any),
  }
})
vi.mock('../../../../src/services/accessRequest.js', () => accessRequestMock)

const responseMock = vi.hoisted(() => {
  return {
    findResponsesById: vi.fn(() => undefined as any),
  }
})
vi.mock('../../../../src/services/response.js', () => responseMock)

describe('routes > accessRequest > getAccessRequest', () => {
  test('200 > ok', async () => {
    const accessRequestDoc = new AccessRequestModel({ ...testAccessRequest })
    accessRequestMock.getAccessRequestById.mockResolvedValueOnce(accessRequestDoc)
    responseMock.findResponsesById.mockResolvedValueOnce([])

    const fixture = createFixture(getAccessRequestSchema)
    const res = await testGet(`/api/v2/model/anything/access-request/${fixture.params.accessRequestId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const accessRequestDoc = new AccessRequestModel({ ...testAccessRequest })
    accessRequestMock.getAccessRequestById.mockResolvedValueOnce(accessRequestDoc)
    responseMock.findResponsesById.mockResolvedValue([])

    const fixture = createFixture(getAccessRequestSchema)
    const res = await testGet(`/api/v2/model/anything/access-request/${fixture.params.accessRequestId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewAccessRequest).toBeCalled()
    expect(audit.onViewAccessRequest.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
