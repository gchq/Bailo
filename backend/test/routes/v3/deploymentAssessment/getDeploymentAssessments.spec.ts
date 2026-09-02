import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const deploymentAssessment = {
  _id: 'mongo-object-id',
  __v: 1,
  id: 'assessment-abc123',
  name: 'Assessment',
  schemaId: 'deployment-assessment-schema',
  metadata: {
    overview: {
      riskOwner: ['user:risk-owner'],
      justification: 'Owns the deployment risk.',
      modelIds: ['model-one', 'model-two'],
    },
    deletedInformation: 'must not be returned',
  },
  draft: false,
  createdBy: 'creator',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  deletedAt: new Date('2026-01-03T00:00:00.000Z'),
}

const serviceMock = vi.hoisted(() => ({
  searchDeploymentAssessments: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > deploymentAssessment > getDeploymentAssessments', () => {
  test('searches deployment assessments using all filters', async () => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([deploymentAssessment])

    const res = await testGet(
      '/api/v3/deployment-assessments?schemaId=deployment-assessment-schema&modelIds=model-one&modelIds=model-two&riskOwner=user%3Arisk-owner&createdBy=creator&createdAfter=2026-01-01&createdBefore=2026-01-31&draft=false&search=deployment%20justification&state=approved&needsAction=true',
    )

    expect(res.statusCode).toBe(200)
    expect(serviceMock.searchDeploymentAssessments).toHaveBeenCalledWith(expect.anything(), {
      schemaId: 'deployment-assessment-schema',
      modelIds: ['model-one', 'model-two'],
      riskOwner: 'user:risk-owner',
      createdBy: 'creator',
      createdAfter: '2026-01-01',
      createdBefore: '2026-01-31',
      draft: false,
      search: 'deployment justification',
      state: 'approved',
      needsAction: true,
    })
    expect(res.body).toEqual({
      deploymentAssessments: [
        {
          id: 'assessment-abc123',
          schemaId: 'deployment-assessment-schema',
          name: 'Assessment',
          owner: ['user:risk-owner'],
          models: ['model-one', 'model-two'],
          justification: 'Owns the deployment risk.',
          draft: false,
          createdBy: 'creator',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
    expect(audit.onSearchDeploymentAssessments).toHaveBeenCalledWith(expect.anything(), [deploymentAssessment])
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

  test('returns the timestamp of the latest review', async () => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([
      { ...deploymentAssessment, state: 'rejected', reviewedAt: new Date('2026-02-03T00:00:00.000Z') },
    ])

    const res = await testGet('/api/v3/deployment-assessments?needsAction=true')

    expect(res.statusCode).toBe(200)
    expect(res.body.deploymentAssessments[0]).toMatchObject({
      state: 'rejected',
      reviewedAt: '2026-02-03T00:00:00.000Z',
    })
  })

  test('omits the review timestamp when the assessment has not been reviewed', async () => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([{ ...deploymentAssessment, draft: true }])

    const res = await testGet('/api/v3/deployment-assessments?needsAction=true')

    expect(res.statusCode).toBe(200)
    expect(res.body.deploymentAssessments[0]).not.toHaveProperty('reviewedAt')
  })
})
