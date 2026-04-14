import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { calculateModelVolume, ModelVolumePeriodEnum } from '../../../services/metrics.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getModelVolumeSchema = z.object({
  query: z
    .object({
      period: ModelVolumePeriodEnum.openapi({ example: 'month' }),
      startDate: z
        .string()
        .date()
        .optional()
        .refine((d) => d === undefined || !isNaN(Date.parse(d)), {
          message: 'Invalid ISO date format',
        })
        .openapi({ example: '2026-01-01' }),
      endDate: z
        .string()
        .date()
        .optional()
        .refine((d) => d === undefined || !isNaN(Date.parse(d)), {
          message: 'Invalid ISO date format',
        })
        .openapi({ example: '2026-04-01' }),
      timezone: z.string().optional().openapi({ example: 'UTC' }),
      organisation: z.string().optional().openapi({ example: 'Acme Corp' }),
    })
    .refine(
      (data) =>
        data.startDate === undefined ||
        data.endDate === undefined ||
        new Date(data.startDate) <= new Date(data.endDate),
      {
        message: 'startDate must be before or equal to endDate',
        path: ['endDate'],
      },
    ),
})

export const ModelVolumeDataPointSchema = z.object({
  periodStart: z.string().datetime().openapi({ example: '2026-01-01' }),
  periodEnd: z.string().datetime().openapi({ example: '2026-01-31' }),
  count: z.number().int().nonnegative().openapi({ example: 7 }),
})

const GetModelVolumeResponseSchema = z.object({
  period: ModelVolumePeriodEnum.openapi({ example: 'month' }),
  startDate: z.string().date().openapi({ example: '2026-01-01' }),
  endDate: z.string().date().openapi({ example: '2026-04-01' }),
  data: z.array(ModelVolumeDataPointSchema),
})

registerPath({
  method: 'get',
  path: '/api/v2/metrics/modelVolume',
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

type GetModelVolumeResponses = z.infer<typeof GetModelVolumeResponseSchema>

export const getModelVolume = [
  async (req: Request, res: Response<GetModelVolumeResponses>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric
    const {
      query: { period, startDate, endDate, timezone, organisation },
    } = parse(req, getModelVolumeSchema)

    const {
      startDate: modelVolumeStartDate,
      endDate: modelVolumeEndDate,
      dataPoints: modelVolumeDataPoints,
    } = await calculateModelVolume(period, startDate, endDate, timezone, organisation)

    await audit.onViewMetric(req)

    res.json({ period, startDate: modelVolumeStartDate, endDate: modelVolumeEndDate, data: modelVolumeDataPoints })
  },
]
