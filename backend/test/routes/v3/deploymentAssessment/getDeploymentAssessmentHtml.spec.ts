import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/index.js'
import { DeploymentAssessmentInterface } from '../../../../src/models/DeploymentAssessment.js'
import { UserInterface } from '../../../../src/models/User.js'
import { getDeploymentAssessmentHtmlSchema } from '../../../../src/routes/v3/deploymentAssessment/getDeploymentAssessmentHtml.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const deploymentAssessment: DeploymentAssessmentInterface = {
  id: 'test-da-35fcd',
  name: 'Test DA',
  createdAt: new Date(),
  updatedAt: new Date(),
  draft: true,
  schemaId: 'schema123',
  createdBy: 'Joe Bloggs',
  metadata: {
    modelOverview: {
      modelIds: ['test-123'],
    },
    signOff: {
      riskOwner: ['user:user'],
    },
  },
}
const mockUser: UserInterface = { dn: 'user' }
const mockHtmlService = vi.hoisted(() => {
  return {
    getDeploymentAssessmentHtml: vi.fn(() => ({ html: 'html', deploymentAssessment: deploymentAssessment })),
  }
})
vi.mock('../../../../src/services/htmlExport.js', () => mockHtmlService)

describe('routes > deploymentAssessment > getDeploymentAssessmentHtml', () => {
  test('should return html', async () => {
    const fixture = createFixture(getDeploymentAssessmentHtmlSchema)
    const res = await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}/html`)
    expect(mockHtmlService.getDeploymentAssessmentHtml).toHaveBeenCalledWith(
      mockUser,
      fixture.params.deploymentAssessmentId,
    )
    expect(res.statusCode).toBe(200)
    expect(res.text).toBe('html')
  })

  test('should call audit', async () => {
    const fixture = createFixture(getDeploymentAssessmentHtmlSchema)
    await testGet(`/api/v3/deployment-assessments/${fixture.params.deploymentAssessmentId}/html`)

    expect(audit.onViewDeploymentAssessment).toHaveBeenCalled()
  })
})
