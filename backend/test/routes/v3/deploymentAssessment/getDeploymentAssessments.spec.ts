import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'
import { testDeploymentAssessment } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const deploymentAssessment = {
  ...testDeploymentAssessment,
  _id: 'mongo-object-id',
  __v: 1,
  metadata: {
    ...testDeploymentAssessment.metadata,
    deletedInformation: 'must not be returned',
  },
  deletedAt: new Date('2026-01-03T00:00:00.000Z'),
}

const serviceMock = vi.hoisted(() => ({
  searchDeploymentAssessments: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > deploymentAssessment > getDeploymentAssessments', () => {
  test('searches deployment assessments using all filters', async () => {
    serviceMock.searchDeploymentAssessments.mockResolvedValueOnce([deploymentAssessment])

    const { id, schemaId, name, draft, createdBy, createdAt } = testDeploymentAssessment
    const { riskOwner, modelIds, justification } = testDeploymentAssessment.metadata.overview
    const query = new URLSearchParams({
      schemaId,
      riskOwner,
      createdBy,
      createdAfter: '2023-07-28',
      createdBefore: '2023-07-31',
      draft: String(draft),
      search: 'deployment justification',
    })
    modelIds.forEach((modelId) => query.append('modelIds', modelId))

    const res = await testGet(`/api/v3/deployment-assessments?${query}`)

    expect(res.statusCode).toBe(200)
    expect(serviceMock.searchDeploymentAssessments).toHaveBeenCalledWith(expect.anything(), {
      schemaId,
      modelIds,
      riskOwner,
      createdBy,
      createdAfter: '2023-07-28',
      createdBefore: '2023-07-31',
      draft,
      search: 'deployment justification',
    })
    expect(res.body).toEqual({
      deploymentAssessments: [
        {
          id,
          schemaId,
          name,
          owner: riskOwner,
          models: modelIds,
          justification,
          draft,
          createdBy,
          createdAt: createdAt.toISOString(),
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
    'unknown=value',
  ])('rejects the malformed query %s', async (query) => {
    const res = await testGet(`/api/v3/deployment-assessments?${query}`)

    expect(res.statusCode).toBe(400)
    expect(serviceMock.searchDeploymentAssessments).not.toHaveBeenCalled()
  })
})
