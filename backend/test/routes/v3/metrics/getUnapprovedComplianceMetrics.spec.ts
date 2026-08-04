import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockAuth = vi.hoisted(() => ({
  authenticationMiddleware: vi.fn(() => [
    {
      path: '/',
      middleware: (req: any, _res: any, next: any) => {
        req.user = { dn: 'test-user' }
        next()
      },
    },
  ]),
  hasRole: vi.fn(),
}))

vi.mock('../../../../src/connectors/authentication/index.js', () => ({
  default: mockAuth,
}))

const mockMetricsConnector = vi.hoisted(() => ({
  getUnapprovedComplianceMetrics: vi.fn(),
}))

vi.mock('../../../../src/connectors/metrics/index.js', () => ({
  default: mockMetricsConnector,
}))

describe('routes > metrics > getUnapprovedComplianceMetrics', () => {
  test('200 > returns compliance metrics when user is Admin', async () => {
    const example = {
      global: {
        summary: {
          totalModelsWithUnapprovedReleases: 1,
          totalUnapprovedReleases: 2,
        },
        entries: [
          {
            entryId: 'model-123',
            modelOwners: ['alice'],
            unapprovedReleases: ['1.0.0', '1.1.0'],
          },
        ],
      },
      byOrganisation: [
        {
          organisation: 'mcdonalds',
          modelsWithUnapprovedReleases: 1,
          entries: [
            {
              entryId: 'model-123',
              modelOwners: ['alice'],
              unapprovedReleases: ['1.0.0', '1.1.0'],
            },
          ],
        },
      ],
    }
    mockMetricsConnector.getUnapprovedComplianceMetrics.mockResolvedValue(example)

    const res = await testGet('/api/v3/metrics/compliance/unapproved')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(example)

    expect(mockMetricsConnector.getUnapprovedComplianceMetrics).toHaveBeenCalled()
    expect(audit.onViewMetric).toHaveBeenCalled()
  })
})
