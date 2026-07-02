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
  getRoleComplianceMetrics: vi.fn(),
  getNoReleasesMetrics: vi.fn(),
}))

vi.mock('../../../../src/connectors/metrics/index.js', () => ({
  default: mockMetricsConnector,
}))

describe('routes > metrics > getNoReleasesComplianceMetrics', () => {
  test('200 > returns compliance metrics when user is Admin', async () => {
    mockMetricsConnector.getNoReleasesMetrics.mockResolvedValue({
      global: {
        summary: [
          { role: 'Reviewer', count: 2 },
          { role: 'Owner', count: 1 },
        ],
        models: [{ id: 'model-1', organisation: 'Example Organisation', owners: ['user:user'] }],
      },
      byOrganisation: [],
    })

    const res = await testGet('/api/v3/metrics/compliance/no-releases')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      global: {
        summary: [
          { role: 'Reviewer', count: 2 },
          { role: 'Owner', count: 1 },
        ],
        models: [{ id: 'model-1', organisation: 'Example Organisation', owners: ['user:user'] }],
      },
      byOrganisation: [],
    })

    expect(mockMetricsConnector.getNoReleasesMetrics).toHaveBeenCalled()
    expect(audit.onViewMetric).toHaveBeenCalled()
  })
})
