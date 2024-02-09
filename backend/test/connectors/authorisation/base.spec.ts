import { describe, expect, test, vi } from 'vitest'

import { BasicAuthorisationConnector } from '../../../src/connectors/v2/authorisation/base.js'
import { ModelDoc } from '../../../src/models/v2/Model.js'
import { UserDoc } from '../../../src/models/v2/User.js'

const mockAccessRequestService = vi.hoisted(() => ({
  getModelAccessRequestsForUser: vi.fn(),
}))
vi.mock('../../../src/services/v2/accessRequest.js', () => mockAccessRequestService)

const mockModelService = vi.hoisted(() => ({}))
vi.mock('../../../src/services/v2/model.js', () => mockModelService)

const mockReviewService = vi.hoisted(() => ({
  checkAccessRequestsApproved: vi.fn(),
}))
vi.mock('../../../src/services/v2/review.js', () => mockReviewService)

describe('connectors > authorisation > base', () => {
  const user = { dn: 'testUser' } as UserDoc
  const model = { id: 'testModel' } as ModelDoc

  test('hasApprovedAccessRequest > no access requests for model', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockReturnValueOnce([])

    const result = await connector.hasApprovedAccessRequest(user, model)

    expect(result).toBe(false)
  })

  test('hasApprovedAccessRequest > return access request check', async () => {
    const connector = new BasicAuthorisationConnector()
    mockAccessRequestService.getModelAccessRequestsForUser.mockReturnValueOnce([{ id: 'accessRequest' }])
    const approvedAccessRequest = true
    mockReviewService.checkAccessRequestsApproved.mockReturnValueOnce(approvedAccessRequest)

    const result = await connector.hasApprovedAccessRequest(user, model)

    expect(result).toBe(approvedAccessRequest)
  })
})
