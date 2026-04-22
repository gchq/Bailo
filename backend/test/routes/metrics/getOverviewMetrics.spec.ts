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
  calculateOverviewMetrics: vi.fn(),
}))

vi.mock('../../../src/services/metrics.js', () => mockMetricsService)

describe('routes > metrics > getOverviewMetrics', () => {
  test('200 > returns metrics when user is Admin', async () => {
    mockAuth.hasRole.mockResolvedValue(true)

    mockMetricsService.calculateOverviewMetrics.mockResolvedValue({
      global: {
        users: 1,
        models: 2,
        schemaBreakdown: [],
        modelState: [],
        withReleases: 1,
        withAccessRequest: 0,
      },
      byOrganisation: [],
    })

    const res = await testGet('/api/v2/metrics')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      global: {
        users: 1,
        models: 2,
        schemaBreakdown: [],
        modelState: [],
        withReleases: 1,
        withAccessRequest: 0,
      },
      byOrganisation: [],
    })

    expect(mockMetricsService.calculateOverviewMetrics).toHaveBeenCalled()
    expect(audit.onViewMetric).toHaveBeenCalled()
  })

  test('403 > user without Admin role is rejected', async () => {
    mockAuth.hasRole.mockResolvedValue(false)

    const res = await testGet('/api/v2/metrics')

    expect(res.statusCode).toBe(403)
  })
})
