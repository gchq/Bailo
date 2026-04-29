import { ModelVolumeBucket } from '../connectors/metrics/base.js'
import { getMetricsConnector } from '../connectors/metrics/index.js'
import { GetModelVolumeResponse } from '../routes/v2/metrics/getModelVolume.js'
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
  bucket: ModelVolumeBucket,
  startDate: string | number | Date,
  endDate: string | number | Date,
  timezone?: string,
): Promise<GetModelVolumeResponse> {
  return metrics.calculateModelVolume(bucket, startDate, endDate, timezone)
}
