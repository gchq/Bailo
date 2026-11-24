import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { deleteDeploymentAssessmentSchema } from '../../../../src/routes/v3/deploymentAssessment/deleteDeploymentAssessment.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/utils/transactions.js')

const serviceMock = vi.hoisted(() => ({
  removeDeploymentAssessment: vi.fn(() => ({ id: 'deployment-assessment-id' })),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > deleteDeploymentAssessment', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(deleteDeploymentAssessmentSchema)
    const res = await testDelete(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}`)

    expect(res.statusCode).toBe(200)
    expect(serviceMock.removeDeploymentAssessment).toHaveBeenCalled()
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(deleteDeploymentAssessmentSchema)
    const res = await testDelete(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteDeploymentAssessment).toHaveBeenCalled()
    expect(audit.onDeleteDeploymentAssessment.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
