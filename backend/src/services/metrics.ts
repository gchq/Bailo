import { PipelineStage } from 'mongoose'

import { z } from '../lib/zod.js'
import ModelModel from '../models/Model.js'
import { ModelVolumeDataPointSchema } from '../routes/v2/metrics/getModelVolume.js'
import { BadReq } from '../utils/error.js'

export const ModelVolumePeriodEnum = z.enum(['day', 'week', 'month', 'quarter', 'year'])
type ModelVolumePeriod = z.infer<typeof ModelVolumePeriodEnum>
type ModelVolumeDataPoint = z.infer<typeof ModelVolumeDataPointSchema>

export async function calculateModelVolume(
  period: ModelVolumePeriod,
  startDate: string | number | Date = 0,
  endDate?: string | number | Date,
  timezone?: string,
  organisation?: string,
): Promise<{ startDate: string; endDate: string; dataPoints: ModelVolumeDataPoint[] }> {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()

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
            ...(timezone && { timezone }),
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
            ...(timezone && { timezone }),
          },
        },
        count: 1,
      },
    },
  ]

  try {
    const dataPoints = await ModelModel.aggregate<{
      periodStart: Date
      periodEnd: Date
      count: number
    }>(pipeline)

    const formattedDataPoints = dataPoints.map((dataPoint) => ({
      periodStart: dataPoint.periodStart.toISOString(),
      periodEnd: dataPoint.periodEnd.toISOString(),
      count: dataPoint.count,
    }))

    return { startDate: start.toISOString(), endDate: end.toISOString(), dataPoints: formattedDataPoints }
  } catch (err: any) {
    if (err?.message?.includes('timezone') || err?.message?.includes('Time zone')) {
      throw BadReq('Invalid timezone. Must be a valid IANA timezone or UTC offset.')
    }

    throw err
  }
}
