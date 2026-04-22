import { z } from '../../lib/zod.js'
import { GetOverviewMetricsResponse } from '../../routes/v2/metrics/getOverviewMetrics.js'
import { GetPolicyMetricsResponse } from '../../routes/v2/metrics/getPolicyMetrics.js'

export const ModelVolumeDataPointSchema = z.object({
  periodStart: z.string().datetime().openapi({ example: '2026-01-01' }),
  periodEnd: z.string().datetime().openapi({ example: '2026-01-31' }),
  count: z.number().int().nonnegative().openapi({ example: 7 }),
})

export const ModelVolumePeriodEnum = z.enum(['day', 'week', 'month', 'quarter', 'year'])
export type ModelVolumePeriod = z.infer<typeof ModelVolumePeriodEnum>
export type ModelVolumeDataPoint = z.infer<typeof ModelVolumeDataPointSchema>

export abstract class BaseMetricsConnector {
  abstract calculateOverviewMetrics(): Promise<GetOverviewMetricsResponse>
  abstract calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse>
  abstract calculateModelVolume(
    period: ModelVolumePeriod,
    startDate: string | number | Date,
    endDate?: string | number | Date,
    timezone?: string,
    organisation?: string,
  ): Promise<{ startDate: string; endDate: string; dataPoints: ModelVolumeDataPoint[] }>
}
