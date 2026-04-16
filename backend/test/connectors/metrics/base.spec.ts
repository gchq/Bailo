import { describe, expect, test } from 'vitest'

import { BaseMetricsConnector } from '../../../src/connectors/metrics/base.js'
import { GetPolicyMetricsResponse } from '../../../src/routes/v2/metrics/getPolicyMetrics.js'

class TestMetricsConnector extends BaseMetricsConnector {
  async calculateOverviewMetrics(): Promise<any> {
    return {
      global: { users: 1, models: 2 },
      byOrganisation: [],
    }
  }
  async calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse> {
    return {
      global: {
        summary: [],
        models: [],
      },
      byOrganisation: [],
    }
  }
}

describe('connectors > metrics > base', () => {
  test('subclass can implement calculateOverviewMetrics()', async () => {
    const connector = new TestMetricsConnector()

    const result = await connector.calculateOverviewMetrics()

    expect(result).toEqual({
      global: { users: 1, models: 2 },
      byOrganisation: [],
    })
  })
})
