import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import AccessRequestModel from '../../../../src/models/AccessRequest.js'
import { GetAccessRequestsSchema } from '../../../../src/routes/v2/model/accessRequest/getAccessRequests.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'
import { testAccessRequest } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const accessRequestsMock = vi.hoisted(() => {
  return {
    findAccessRequest: vi.fn(() => undefined as any),
  }
})
vi.mock('../../../../src/services/accessRequest.js', () => accessRequestsMock)

const responseMock = vi.hoisted(() => {
  return {
    findResponses: vi.fn(() => undefined as any),
  }
})
vi.mock('../../../../src/services/response.js', () => responseMock)

describe('routes > accessRequest > getAccessRequests', () => {
  test('200 > ok', async () => {
    const accessRequestDoc = new AccessRequestModel({ ...testAccessRequest })
    accessRequestsMock.findAccessRequest.mockResolvedValueOnce(accessRequestDoc)
    responseMock.findResponses.mockResolvedValue([testAccessRequest])

    const fixture = createFixture(GetAccessRequestsSchema)
    const res = await testGet(`/api/v2/model/access-requests/testing?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const accessRequestDoc = new AccessRequestModel({ ...testAccessRequest })
    accessRequestsMock.findAccessRequest.mockResolvedValueOnce(accessRequestDoc)
    responseMock.findResponses.mockResolvedValue([testAccessRequest])

    const fixture = createFixture(GetAccessRequestsSchema)
    const res = await testGet(`/api/v2/model/access-requests/testing?${qs.stringify(fixture.query)}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewAccessRequests).toBeCalled()
    expect(audit.onViewAccessRequests.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
