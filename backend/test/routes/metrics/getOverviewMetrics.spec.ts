import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authentication/index.js')
vi.mock('../../../../src/services/metrics.js')

/**
 * Mock authentication connector
 */
const mockAuth = vi.hoisted(() => ({
  hasRole: vi.fn(),
}))
vi.mock('../../../../src/connectors/authentication/index.js', () => ({
  default: mockAuth,
}))

/**
 * Mock metrics service
 */
const mockMetricsService = vi.hoisted(() => ({
  calculateOverviewMetrics: vi.fn(),
}))
vi.mock('../../../../src/services/metrics.js', () => mockMetricsService)

/**
 * Mock audit connector
 */
const mockAudit = vi.hoisted(() => ({
  onViewMetric: vi.fn(),
}))
vi.mock('../../../../src/connectors/audit/index.js', () => ({
  default: mockAudit,
}))

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
    expect(mockAudit.onViewMetric).toHaveBeenCalled()
  })

  test('403 > user without Admin role is rejected', async () => {
    mockAuth.hasRole.mockResolvedValue(false)

    const res = await testGet('/api/v2/metrics')

    expect(res.statusCode).toBe(403)
  })
})
