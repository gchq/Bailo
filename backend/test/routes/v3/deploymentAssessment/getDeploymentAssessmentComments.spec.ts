import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getDeploymentAssessmentCommentsSchema } from '../../../../src/routes/v3/deploymentAssessment/getDeploymentAssessmentComments.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const serviceMock = vi.hoisted(() => ({
  getCommentsByDeploymentAssessmentId: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > getDeploymentAssessmentComments', () => {
  test('200 > ok', async () => {
    serviceMock.getCommentsByDeploymentAssessmentId.mockResolvedValueOnce({
      id: 'assessment-id',
      name: 'Assessment',
      comments: [
        {
          id: 'comment-id',
          entity: 'user:commenter',
          comment: 'A comment',
          reactions: [{ kind: 'like', users: ['user:reactor'] }],
          commentEditedAt: '2026-01-02T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
    })
    const fixture = createFixture(getDeploymentAssessmentCommentsSchema)
    const res = await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}/comments`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    serviceMock.getCommentsByDeploymentAssessmentId.mockResolvedValueOnce({
      id: 'assessment-id',
      name: 'Assessment',
      comments: [],
    })
    const fixture = createFixture(getDeploymentAssessmentCommentsSchema)
    const res = await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}/comments`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewDeploymentAssessmentComments).toHaveBeenCalled()
    expect(audit.onViewDeploymentAssessmentComments).toHaveBeenCalledWith(
      expect.anything(),
      fixture.params.deploymentAssessmentId,
    )
  })
})
