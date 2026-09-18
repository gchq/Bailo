import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getDeploymentAssessmentsSchema } from '../../../../src/routes/v3/deploymentAssessment/getDeploymentAssessments.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const deploymentAssessmentSummary = {
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  name: 'Assessment',
  owner: ['user:risk-owner'],
  models: ['model-one', 'model-two'],
  draft: false,
  createdBy: 'creator',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const serviceMock = vi.hoisted(() => ({
  searchDeploymentAssessments: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > deploymentAssessment > getDeploymentAssessments', () => {
  test('200 > ok', async () => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([deploymentAssessmentSummary])
    const fixture = createFixture(getDeploymentAssessmentsSchema)
    const res = await testGet(
      `/api/v3/deployment-assessments?${qs.stringify(fixture.query, { arrayFormat: 'repeat' })}`,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([deploymentAssessmentSummary])
    const fixture = createFixture(getDeploymentAssessmentsSchema)
    const res = await testGet(
      `/api/v3/deployment-assessments?${qs.stringify(fixture.query, { arrayFormat: 'repeat' })}`,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onSearchDeploymentAssessments).toHaveBeenCalled()
    expect(audit.onSearchDeploymentAssessments.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('supports a single model filter', async () => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([])

    const res = await testGet('/api/v3/deployment-assessments?modelIds=model-one')

    expect(res.statusCode).toBe(200)
    expect(serviceMock.searchDeploymentAssessments).toHaveBeenCalledWith(expect.anything(), { modelIds: ['model-one'] })
  })

  test.each([
    ['createdAfter', '2026-01-01', { createdAfter: '2026-01-01' }],
    ['createdBefore', '2026-01-31', { createdBefore: '2026-01-31' }],
  ])('supports a creation window with only %s', async (parameter, value, expectedQuery) => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([])

    const res = await testGet(`/api/v3/deployment-assessments?${parameter}=${value}`)

    expect(res.statusCode).toBe(200)
    expect(serviceMock.searchDeploymentAssessments).toHaveBeenCalledWith(expect.anything(), expectedQuery)
  })

  test('rejects a reversed creation window', async () => {
    const res = await testGet('/api/v3/deployment-assessments?createdAfter=2026-02-01&createdBefore=2026-01-01')

    expect(res.statusCode).toBe(400)
    expect(serviceMock.searchDeploymentAssessments).not.toHaveBeenCalled()
  })

  test.each([
    'schemaId=',
    'riskOwner=',
    'createdBy=',
    'createdAfter=invalid',
    'createdBefore=2026-01-01T00%3A00%3A00.000Z',
    'draft=invalid',
    'search=',
    'state=invalid',
    'needsAction=invalid',
    'unknown=value',
  ])('rejects the malformed query %s', async (query) => {
    const res = await testGet(`/api/v3/deployment-assessments?${query}`)

    expect(res.statusCode).toBe(400)
    expect(serviceMock.searchDeploymentAssessments).not.toHaveBeenCalled()
  })
})
