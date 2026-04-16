import { getMetricsConnector } from '../connectors/metrics/index.js'
import { UserInterface } from '../models/User.js'
import { GetOverviewMetricsResponse } from '../routes/v2/metrics/getOverviewMetrics.js'
import { GetPolicyMetricsResponse } from '../routes/v2/metrics/getPolicyMetrics.js'

const metrics = getMetricsConnector()

export async function calculateOverviewMetrics(user: UserInterface): Promise<GetOverviewMetricsResponse> {
  return metrics.calculateOverviewMetrics(user)
}

export async function calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse> {
  return metrics.calculatePolicyMetrics()
}
