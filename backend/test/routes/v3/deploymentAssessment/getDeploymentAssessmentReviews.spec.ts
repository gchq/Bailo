import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getDeploymentAssessmentReviewsSchema } from '../../../../src/routes/v3/deploymentAssessment/getDeploymentAssessmentReviews.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const serviceMock = vi.hoisted(() => ({
  getReviewsByDeploymentAssessmentId: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > getDeploymentAssessmentReviews', () => {
  test('200 > ok', async () => {
    serviceMock.getReviewsByDeploymentAssessmentId.mockResolvedValueOnce({
      id: 'assessment-id',
      name: 'Assessment',
      statuses: [{ role: 'riskOwners', status: 'request_changes' }],
      reviews: [
        {
          id: 'review-id',
          entity: 'user:risk-owner',
          decision: 'request_changes',
          comment: 'Please add further mitigations.',
          reactions: [{ kind: 'heart', users: ['user:reactor'] }],
          commentEditedAt: '2026-01-02T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          outdated: false,
        },
      ],
    })
    const fixture = createFixture(getDeploymentAssessmentReviewsSchema)
    const res = await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}/reviews`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    serviceMock.getReviewsByDeploymentAssessmentId.mockResolvedValueOnce({
      id: 'assessment-id',
      name: 'Assessment',
      statuses: [],
      reviews: [],
    })
    const fixture = createFixture(getDeploymentAssessmentReviewsSchema)
    const res = await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}/reviews`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewDeploymentAssessmentReviews).toHaveBeenCalled()
    expect(audit.onViewDeploymentAssessmentReviews).toHaveBeenCalledWith(
      expect.anything(),
      fixture.params.deploymentAssessmentId,
    )
  })
})
