import { z } from '../../lib/zod.js'
import { GetModelVolumeResponse } from '../../routes/v2/metrics/getModelVolume.js'
import { GetOverviewMetricsResponse } from '../../routes/v2/metrics/getOverviewMetrics.js'
import { GetPolicyMetricsResponse } from '../../routes/v2/metrics/getPolicyMetrics.js'

export const ModelVolumeDataPointSchema = z.object({
  startDate: z.string().datetime().openapi({ example: '2026-01-01' }),
  endDate: z.string().datetime().openapi({ example: '2026-01-31' }),
  count: z.number().int().nonnegative().openapi({ example: 7 }),
  organisations: z.record(z.number().int().nonnegative()).openapi({
    example: {
      unset: 1,
      'E corporation': 3,
      'A corporation': 2,
    },
  }),
})

export const ModelVolumeBucketEnum = z.enum(['day', 'week', 'month', 'quarter', 'year'])
export type ModelVolumeBucket = z.infer<typeof ModelVolumeBucketEnum>
export type ModelVolumeDataPoint = z.infer<typeof ModelVolumeDataPointSchema>

export abstract class BaseMetricsConnector {
  abstract calculateOverviewMetrics(): Promise<GetOverviewMetricsResponse>
  abstract calculatePolicyMetrics(): Promise<GetPolicyMetricsResponse>
  abstract calculateModelVolume(
    period: ModelVolumeBucket,
    startDate: string | number | Date,
    endDate: string | number | Date,
    timezone?: string,
  ): Promise<GetModelVolumeResponse>
}
