import { describe, expect, test } from 'vitest'

import { BaseMetricsConnector } from '../../../src/connectors/metrics/base.js'
import { UserInterface } from '../../../src/models/User.js'
import { GetPolicyMetricsResponse } from '../../../src/routes/v2/metrics/getPolicyMetrics.js'

class TestMetricsConnector extends BaseMetricsConnector {
  async calculateOverviewMetrics(user: UserInterface): Promise<any> {
    // todo remove
    if (!user) {
      return {
        global: { users: 1, models: 2 },
        byOrganisation: [],
      }
    }
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

    const result = await connector.calculateOverviewMetrics({} as any)

    expect(result).toEqual({
      global: { users: 1, models: 2 },
      byOrganisation: [],
    })
  })
})
