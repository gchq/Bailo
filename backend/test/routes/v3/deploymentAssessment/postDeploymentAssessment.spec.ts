import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testPost } from '../../../testUtils/routes.js'
import { testDeploymentAssessment } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const serviceMock = vi.hoisted(() => ({
  createDeploymentAssessment: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > v3 > deploymentAssessment > postDeploymentAssessment', () => {
  test('creates a deployment assessment', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce(testDeploymentAssessment)
    const { name, schemaId, metadata, draft } = testDeploymentAssessment
    const fixture = { body: { name, schemaId, metadata, draft } }
    const res = await testPost('/api/v3/deployment-assessments', fixture)

    expect(res.statusCode).toBe(201)
    expect(res.headers.location).toBe(`/api/v3/deployment-assessments/${testDeploymentAssessment.id}`)
    expect(res.body).toEqual({
      deploymentAssessment: {
        ...testDeploymentAssessment,
        createdAt: testDeploymentAssessment.createdAt.toISOString(),
        updatedAt: testDeploymentAssessment.updatedAt.toISOString(),
      },
    })
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), fixture.body)
    expect(audit.onCreateDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), testDeploymentAssessment)
  })

  test.each([
    { riskOwner: 'user:risk-owner', modelIds: [] },
    { justification: 'Owns the deployment risk.', modelIds: ['model-one'] },
    {},
  ])('creates a draft with overview fields set to %j', async (overview) => {
    const draftAssessment = { ...testDeploymentAssessment, metadata: { overview }, draft: true }
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce(draftAssessment)
    const { name, schemaId } = testDeploymentAssessment
    const body = { name, schemaId, metadata: { overview }, draft: true }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), body)
  })

  test('creates a draft by default when draft is not specified', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce({ ...testDeploymentAssessment, draft: true })
    const { name, schemaId } = testDeploymentAssessment
    const body = { name, schemaId, metadata: { overview: {} } }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), { ...body, draft: true })
  })

  test('creates a draft without metadata when draft is not specified', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce({ ...testDeploymentAssessment, draft: true })
    const { name, schemaId } = testDeploymentAssessment
    const body = { name, schemaId }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), { ...body, draft: true })
  })

  test.each([
    { body: {}, description: 'missing required fields' },
    {
      body: { schemaId: testDeploymentAssessment.schemaId, metadata: { overview: {} } },
      description: 'missing deployment assessment name',
    },
    {
      body: { schemaId: testDeploymentAssessment.schemaId, metadata: 'invalid' },
      description: 'non-object metadata',
    },
    {
      body: {
        name: testDeploymentAssessment.name,
        schemaId: testDeploymentAssessment.schemaId,
        metadata: testDeploymentAssessment.metadata,
        createdBy: 'attacker',
      },
      description: 'server-managed property',
    },
    {
      body: { name: testDeploymentAssessment.name, schemaId: testDeploymentAssessment.schemaId, draft: false },
      description: 'missing metadata when draft is false',
    },
  ])('rejects malformed input: $description', async ({ body }) => {
    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(400)
    expect(serviceMock.createDeploymentAssessment).not.toHaveBeenCalled()
  })
})
