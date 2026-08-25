import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { Decision, ResponseKind } from '../../../../src/models/Response.js'
import { testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const serviceMock = vi.hoisted(() => ({
  reviewDeploymentAssessment: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > postDeploymentAssessmentReview', () => {
  test.each([
    [Decision.Approve, undefined],
    [Decision.Reject, 'The deployment risk is unacceptable.'],
    [Decision.RequestChanges, 'Add further mitigations.'],
  ])('creates and audits a %s formal response', async (decision, comment) => {
    const response = { _id: 'response-id', kind: ResponseKind.Review, decision, comment }
    serviceMock.reviewDeploymentAssessment.mockResolvedValueOnce(response)

    const res = await testPost('/api/v3/deployment-assessments/assessment-id/review', {
      body: { decision, ...(comment && { comment }) },
    })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.reviewDeploymentAssessment).toHaveBeenCalledWith(
      expect.anything(),
      'assessment-id',
      decision,
      comment,
    )
    expect(audit.onReviewDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), response)
  })

  test.each([
    { decision: Decision.Reject },
    { decision: Decision.RequestChanges, comment: '   ' },
    { decision: Decision.Undo },
    { decision: 'invalid' },
  ])('rejects an invalid formal response: %j', async (body) => {
    const res = await testPost('/api/v3/deployment-assessments/assessment-id/review', { body })

    expect(res.statusCode).toBe(400)
    expect(serviceMock.reviewDeploymentAssessment).not.toHaveBeenCalled()
  })
})
