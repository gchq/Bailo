import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const deploymentAssessment = {
  id: 'assessment-abc123',
  name: 'Assessment',
  schemaId: 'deployment-assessment-schema',
  metadata: {
    overview: {
      riskOwner: 'user:risk-owner',
      justification: 'Owns the deployment risk.',
      modelIds: ['model-one'],
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

describe('routes > v3 > deploymentAssessment > postDeploymentAssessment', () => {
  test('creates a deployment assessment', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce(deploymentAssessment)
    const fixture = {
      body: {
        name: 'Assessment',
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
    { riskOwner: 'user:risk-owner', modelIds: [] },
    { justification: 'Owns the deployment risk.', modelIds: ['model-one'] },
    {},
  ])('creates a draft with overview fields set to %j', async (overview) => {
    const draftAssessment = {
      ...deploymentAssessment,
      metadata: { overview },
      draft: true,
    }
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce(draftAssessment)
    const body = {
      name: 'Assessment',
      schemaId: 'deployment-assessment-schema',
      metadata: { overview },
      draft: true,
    }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), body)
  })

  test('creates a draft by default when draft is not specified', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce({ ...deploymentAssessment, draft: true })
    const body = {
      name: 'Assessment',
      schemaId: 'deployment-assessment-schema',
      metadata: { overview: {} },
    }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), { ...body, draft: true })
  })

  test('creates a draft without metadata when draft is not specified', async () => {
    serviceMock.createDeploymentAssessment.mockResolvedValueOnce({ ...deploymentAssessment, draft: true })
    const body = {
      name: 'Assessment',
      schemaId: 'deployment-assessment-schema',
    }

    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(201)
    expect(serviceMock.createDeploymentAssessment).toHaveBeenCalledWith(expect.anything(), { ...body, draft: true })
  })

  test.each([
    { body: {}, description: 'missing required fields' },
    {
      body: { schemaId: 'deployment-assessment-schema', metadata: { overview: {} } },
      description: 'missing deployment assessment name',
    },
    { body: { schemaId: 'deployment-assessment-schema', metadata: 'invalid' }, description: 'non-object metadata' },
    {
      body: {
        name: 'Assessment',
        schemaId: 'deployment-assessment-schema',
        metadata: deploymentAssessment.metadata,
        createdBy: 'attacker',
      },
      description: 'server-managed property',
    },
    {
      body: { name: 'Assessment', schemaId: 'deployment-assessment-schema', draft: false },
      description: 'missing metadata when draft is false',
    },
  ])('rejects malformed input: $description', async ({ body }) => {
    const res = await testPost('/api/v3/deployment-assessments', { body })

    expect(res.statusCode).toBe(400)
    expect(serviceMock.createDeploymentAssessment).not.toHaveBeenCalled()
  })
})
