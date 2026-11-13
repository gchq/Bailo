import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { ResponseKind } from '../../../../src/models/Response.js'
import { testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const serviceMock = vi.hoisted(() => ({
  commentOnDeploymentAssessment: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > postDeploymentAssessmentComment', () => {
  test('creates and audits a comment response', async () => {
    const response = { _id: 'response-id', kind: ResponseKind.Comment, comment: 'A question' }
    serviceMock.commentOnDeploymentAssessment.mockResolvedValueOnce(response)

    const res = await testPost('/api/v3/deployment-assessments/assessment-id/comments', {
      body: { comment: 'A question' },
    })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.commentOnDeploymentAssessment).toHaveBeenCalledWith(
      expect.anything(),
      'assessment-id',
      'A question',
    )
    expect(audit.onCommentOnDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), response)
  })

  test.each([{}, { comment: '' }, { comment: '   ' }, { comment: 'Valid', decision: 'approve' }])(
    'rejects malformed input: %j',
    async (body) => {
      const res = await testPost('/api/v3/deployment-assessments/assessment-id/comments', { body })

      expect(res.statusCode).toBe(400)
      expect(serviceMock.commentOnDeploymentAssessment).not.toHaveBeenCalled()
    },
  )
})
