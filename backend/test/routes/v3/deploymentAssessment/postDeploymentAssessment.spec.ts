import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const deploymentAssessment = {
  id: 'assessment-abc123',
  schemaId: 'deployment-assessment-schema',
  metadata: {
    overview: {
      name: 'Assessment',
      riskOwner: 'user:risk-owner',
      justification: 'Owns the deployment risk.',
      models: ['model-one'],
    },
  },
  draft: false,
  createdBy: 'creator',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const serviceMock = vi.hoisted(() => ({
  createDeploymentAssessment: vi.fn(),
}))
vi.mock('../../../../src/services/deploymentAssessment.js', () => serviceMock)

describe('routes > deploymentAssessment > postDeploymentAssessment', () => {
  test('creates a deployment assessment', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce(deploymentAssessment)
    const fixture = {
      body: {
        schemaId: 'deployment-assessment-schema',
        metadata: deploymentAssessment.metadata,
        draft: false,
      },
    }
    const res = await testPost('/api/v3/deployment-assessments', fixture)

    expect(res.statusCode).toBe(201)
    expect(res.headers.location).toBe('/api/v3/deployment-assessments/assessment-abc123')
    expect(res.body).toEqual({
      deploymentAssessment: {
        ...deploymentAssessment,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    })
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), fixture.body)
    expect(audit.onCreateDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), deploymentAssessment)
  })

  test.each([
    { name: 'Assessment' },
    { name: 'Assessment', riskOwner: 'user:risk-owner', models: [] },
    { name: 'Assessment', justification: 'Owns the deployment risk.', models: ['model-one'] },
  ])('creates a draft with overview fields set to %j', async (overview) => {
    const draftAssessment = {
      ...deploymentAssessment,
      metadata: { overview },
      draft: true,
    }
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce(draftAssessment)
    const body = {
      schemaId: 'deployment-assessment-schema',
      metadata: { overview },
      draft: true,
    }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), body)
  })

  test('creates a draft by default', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce({ ...deploymentAssessment, draft: true })
    const body = {
      schemaId: 'deployment-assessment-schema',
      metadata: { overview: { name: 'Assessment' } },
    }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), { ...body, draft: true })
  })

  test.each([
    { body: {}, description: 'missing required fields' },
    {
      body: {
        schemaId: 'deployment-assessment-schema',
        metadata: { overview: { models: ['model-one'] } },
        draft: false,
      },
      description: 'incomplete non-draft overview',
    },
    {
      body: {
        schemaId: 'deployment-assessment-schema',
        metadata: { overview: {} },
        draft: true,
      },
      description: 'nameless draft',
    },
    {
      body: {
        schemaId: 'deployment-assessment-schema',
        metadata: { overview: { ...deploymentAssessment.metadata.overview, models: [] } },
        draft: false,
      },
      description: 'empty model list',
    },
    {
      body: {
        schemaId: 'deployment-assessment-schema',
        metadata: { overview: { ...deploymentAssessment.metadata.overview, models: ['model-one', 'model-one'] } },
      },
      description: 'duplicate model IDs',
    },
    {
      body: {
        schemaId: 'deployment-assessment-schema',
        metadata: deploymentAssessment.metadata,
        createdBy: 'attacker',
      },
      description: 'server-managed property',
    },
  ])('rejects malformed input: $description', async ({ body }) => {
    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(400)
    expect(serviceMock.createDeploymentAssessment).not.toHaveBeenCalled()
  })
})
