import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

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

vi.mock('../../../src/connectors/authentication/index.js', () => ({
  default: mockAuth,
}))

const mockMetricsService = vi.hoisted(() => ({
  calculatePolicyMetrics: vi.fn(),
}))

vi.mock('../../../src/services/metrics.js', () => mockMetricsService)

describe('routes > metrics > getPolicyMetrics', () => {
  test('200 > returns policy metrics when user is Admin', async () => {
    mockAuth.hasRole.mockResolvedValue(true)

    mockMetricsService.calculatePolicyMetrics.mockResolvedValue({
      global: {
        summary: [
          { role: 'Reviewer', count: 2 },
          { role: 'Owner', count: 1 },
        ],
        models: [{ modelId: 'model-1', missingRoles: ['Reviewer'] }],
      },
      byOrganisation: [],
    })

    const res = await testGet('/api/v3/metrics/policy')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      global: {
        summary: [
          { role: 'Reviewer', count: 2 },
          { role: 'Owner', count: 1 },
        ],
        models: [{ modelId: 'model-1', missingRoles: ['Reviewer'] }],
      },
      byOrganisation: [],
    })

    expect(mockMetricsService.calculatePolicyMetrics).toHaveBeenCalled()
    expect(audit.onViewMetric).toHaveBeenCalled()
  })

  test('403 > user without Admin role is rejected', async () => {
    mockAuth.hasRole.mockResolvedValue(false)

    const res = await testGet('/api/v3/metrics/policy')

    expect(res.statusCode).toBe(403)
  })
})
