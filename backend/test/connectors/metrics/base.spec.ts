import { describe, expect, test } from 'vitest'

import { BaseMetricsConnector, ModelVolumeDataPoint, ModelVolumePeriod } from '../../../src/connectors/metrics/base.js'
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
  async calculateModelVolume(
    _period: ModelVolumePeriod,
    startDate: string | number | Date,
    endDate?: string | number | Date,
    _timezone?: string,
    _organisation?: string,
  ): Promise<{
    startDate: string
    endDate: string
    dataPoints: ModelVolumeDataPoint[]
  }> {
    return {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate ?? startDate).toISOString(),
      dataPoints: [],
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
  test('subclass can implement calculatePolicyMetrics()', async () => {
    const connector = new TestMetricsConnector()

    const result = await connector.calculatePolicyMetrics()

    expect(result).toEqual({
      global: {
        summary: [],
        models: [],
      },
      byOrganisation: [],
    })
  })

  test('subclass can implement calculateModelVolume()', async () => {
    const connector = new TestMetricsConnector()

    const result = await connector.calculateModelVolume(
      'month',
      '2026-01-01',
      '2026-03-01',
      'UTC',
      'Example Organisation',
    )

    expect(result).toEqual({
      startDate: new Date('2026-01-01').toISOString(),
      endDate: new Date('2026-03-01').toISOString(),
      dataPoints: [],
    })
  })
})
