import { GetOverviewMetricsResponse } from '../../routes/v2/metrics/getOverviewMetrics.js'
import { GetPolicyMetricsResponse } from '../../routes/v2/metrics/getPolicyMetrics.js'

export abstract class BaseMetricsConnector {
  abstract calculateOverviewMetrics(): Promise<GetOverviewMetricsResponse>
  abstract calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse>
}
