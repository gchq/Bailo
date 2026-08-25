import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { patchDeploymentAssessmentSchema } from '../../../../src/routes/v3/deploymentAssessment/patchDeploymentAssessment.js'
import { createFixture, testPatch } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const serviceMock = vi.hoisted(() => ({
  updateDeploymentAssessment: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > patchDeploymentAssessment', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(patchDeploymentAssessmentSchema)
    const res = await testPatch(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(patchDeploymentAssessmentSchema)
    const res = await testPatch(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateDeploymentAssessment).toHaveBeenCalled()
    expect(audit.onUpdateDeploymentAssessment.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('200 > no draft', async () => {
    const fixture = createFixture(patchDeploymentAssessmentSchema) as any

    delete fixture.body.draft
    const res = await testPatch(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}`, fixture)

    expect(res.statusCode).toEqual(200)
    expect(res.body).matchSnapshot()
  })
})
