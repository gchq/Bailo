import { PipelineStage } from 'mongoose'

import { z } from '../lib/zod.js'
import ModelModel from '../models/Model.js'
import { ModelVolumeDataPointSchema } from '../routes/v2/metrics/getModelVolume.js'

export const ModelVolumePeriodEnum = z.enum(['day', 'week', 'month', 'quarter', 'year'])
type ModelVolumePeriod = z.infer<typeof ModelVolumePeriodEnum>
type ModelVolumeDataPoint = z.infer<typeof ModelVolumeDataPointSchema>

export async function calculateModelVolume(
  period: ModelVolumePeriod,
  startDate: string,
  endDate: string,
  timezone?: string,
  organisation?: string,
): Promise<ModelVolumeDataPoint[]> {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const match: Record<string, unknown> = {
    createdAt: { $gte: start, $lte: end },
  }

  if (organisation) {
    match.organisation = organisation
  }

  const pipeline: PipelineStage[] = [
    { $match: match },

    {
      $group: {
        _id: {
          $dateTrunc: {
            date: '$createdAt',
            unit: period,
            timezone,
          },
        },
        count: { $sum: 1 },
      },
    },

    { $sort: { _id: 1 } },

    {
      $project: {
        _id: 0,
        periodStart: '$_id',
        periodEnd: {
          $dateAdd: {
            startDate: '$_id',
            unit: period,
            amount: 1,
            timezone,
          },
        },
        count: 1,
      },
    },
  ]

  const results = await ModelModel.aggregate<{
    periodStart: Date
    periodEnd: Date
    count: number
  }>(pipeline)

  return results.map((r) => ({
    periodStart: r.periodStart.toISOString(),
    periodEnd: r.periodEnd.toISOString(),
    count: r.count,
  }))
}
