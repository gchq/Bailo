import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getDeploymentAssessmentSchema } from '../../../../src/routes/v3/deploymentAssessment/getDeploymentAssessment.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const serviceMock = vi.hoisted(() => ({
  getDeploymentAssessmentDetails: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > getDeploymentAssessment', () => {
  test('200 > ok', async () => {
    serviceMock.getDeploymentAssessmentDetails.mockResolvedValueOnce({
      deploymentAssessment: { id: 'assessment-id' },
      responses: [],
    })
    const fixture = createFixture(getDeploymentAssessmentSchema)
    const res = await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const deploymentAssessment = { id: 'assessment-id' }
    serviceMock.getDeploymentAssessmentDetails.mockResolvedValueOnce({
      deploymentAssessment,
      responses: [],
    })
    const fixture = createFixture(getDeploymentAssessmentSchema)
    const res = await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewDeploymentAssessment).toHaveBeenCalled()
    expect(audit.onViewDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), deploymentAssessment)
  })
})
