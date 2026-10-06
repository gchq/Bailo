import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockMetricsConnector = vi.hoisted(() => ({
  getLifecycleComplianceMetrics: vi.fn(() => {
    return {
      global: {
        summary: { count: 1 },
        entries: [
          {
            dueDate: '2026-07-18T23:00:00.000Z',
            entryId: 'my-model-123',
            modelOwners: 'user:user',
          },
        ],
      },
    }
  }),
}))

vi.mock('../../../../src/connectors/metrics/index.js', () => ({
  default: mockMetricsConnector,
}))

describe('routes > metrics > compliance > model lifecycle metrics', () => {
  test('200 > ok', async () => {
    const res = await testGet('/api/v3/metrics/compliance/lifecycle?weeksUntilDue=2')

    expect(res.statusCode).toBe(200)
    expect(res.body.global.summary.count).toBe(1)
    expect(res.body.global.entries[0].entryId).toBe('my-model-123')
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const res = await testGet('/api/v3/metrics/compliance/lifecycle?weeksUntilDue=2')

    expect(res.statusCode).toBe(200)
    expect(audit.onViewMetric).toHaveBeenCalled()
    expect(audit.onViewMetric.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
