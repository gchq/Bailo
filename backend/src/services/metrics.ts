import { ModelVolumeDataPoint, ModelVolumePeriod } from '../connectors/metrics/base.js'
import { getMetricsConnector } from '../connectors/metrics/index.js'
import { GetOverviewMetricsResponse } from '../routes/v2/metrics/getOverviewMetrics.js'
import { GetPolicyMetricsResponse } from '../routes/v2/metrics/getPolicyMetrics.js'

const metrics = getMetricsConnector()

export async function calculateOverviewMetrics(): Promise<GetOverviewMetricsResponse> {
  return metrics.calculateOverviewMetrics()
}

export async function calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse> {
  return metrics.calculatePolicyMetrics()
}

export async function calculateModelVolume(
  period: ModelVolumePeriod,
  startDate: string | number | Date = 0,
  endDate?: string | number | Date,
  timezone?: string,
  organisation?: string,
): Promise<{ startDate: string; endDate: string; dataPoints: ModelVolumeDataPoint[] }> {
  return metrics.calculateModelVolume(period, startDate, endDate, timezone, organisation)
}
