import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

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

export const ModelVolumeIntervalEnum = z.enum(['day', 'week', 'month', 'quarter', 'year'])
export type ModelVolumeInterval = z.infer<typeof ModelVolumeIntervalEnum>
export type ModelVolumeDataPoint = z.infer<typeof ModelVolumeDataPointSchema>

export const getModelVolumeSchema = z.object({
  query: z
    .object({
      interval: ModelVolumeIntervalEnum.openapi({ example: 'month' }),

      startDate: z.string().date().openapi({ example: '2026-01-01' }),

      endDate: z.string().date().openapi({ example: '2026-04-01' }),

      timezone: z.string().optional().openapi({ example: 'UTC' }),
    })
    .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
      message: 'startDate must be before or equal to endDate',
      path: ['endDate'],
    }),
})

const GetModelVolumeResponseSchema = z.object({
  interval: ModelVolumeIntervalEnum.openapi({ example: 'month' }),
  startDate: z.string().date().openapi({ example: '2026-01-01' }),
  endDate: z.string().date().openapi({ example: '2026-04-01' }),
  organisation: z.string().optional().openapi({ example: 'Example Organisation' }),
  data: z.array(ModelVolumeDataPointSchema),
})

registerPath({
  method: 'get',
  path: '/api/v3/metrics/modelVolume',
  tags: ['metrics'],
  description: 'Returns the count of models created over time, aggregated by the specified period.',
  schema: getModelVolumeSchema,
  responses: {
    200: {
      description: 'Details about the historic model volumes.',
      content: {
        'application/json': {
          schema: GetModelVolumeResponseSchema,
        },
      },
    },
  },
})

export type GetModelVolumeResponse = z.infer<typeof GetModelVolumeResponseSchema>

export const getModelVolume = [
  async (req: Request, res: Response<GetModelVolumeResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    const {
      query: { interval, startDate, endDate, timezone },
    } = parse(req, getModelVolumeSchema)

    const {
      startDate: modelVolumeStartDate,
      endDate: modelVolumeEndDate,
      data: modelVolumeDataPoints,
    } = await metrics.calculateModelVolume(req.user, interval, startDate, endDate, timezone)

    await audit.onViewMetric(req)

    res.json({ interval, startDate: modelVolumeStartDate, endDate: modelVolumeEndDate, data: modelVolumeDataPoints })
  },
]
