import { UserInterface } from '../../models/User.js'
import { GetOverviewMetricsResponse } from '../../routes/v2/metrics/getOverviewMetrics.js'
import { GetPolicyMetricsResponse } from '../../routes/v2/metrics/getPolicyMetrics.js'

export abstract class BaseMetricsConnector {
  abstract calculateOverviewMetrics(user: UserInterface): Promise<GetOverviewMetricsResponse>
  abstract calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse>
}
