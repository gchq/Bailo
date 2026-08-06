import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const EntryVolumeDataPointSchema = z.object({
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

export const EntryVolumeIntervalEnum = z.enum(['day', 'week', 'month', 'quarter', 'year'])
export type EntryVolumeInterval = z.infer<typeof EntryVolumeIntervalEnum>
export type EntryVolumeDataPoint = z.infer<typeof EntryVolumeDataPointSchema>

export const getEntryVolumeSchema = z.object({
  query: z
    .object({
      interval: EntryVolumeIntervalEnum.openapi({ example: 'month' }),

      startDate: z.string().date().openapi({ example: '2026-01-01' }),

      endDate: z.string().date().openapi({ example: '2026-04-01' }),

      timezone: z.string().optional().openapi({ example: 'UTC' }),
    })
    .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
      message: 'startDate must be before or equal to endDate',
      path: ['endDate'],
    }),
})

const GetEntryVolumeResponseSchema = z.object({
  lastUpdated: z.string(),
  interval: EntryVolumeIntervalEnum.openapi({ example: 'month' }),
  startDate: z.string().date().openapi({ example: '2026-01-01' }),
  endDate: z.string().date().openapi({ example: '2026-04-01' }),
  data: z.array(EntryVolumeDataPointSchema),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/metrics/entryVolume',
    tags: ['metrics'],
    description: 'Returns the count of models created over time, aggregated by the specified period.',
    schema: getEntryVolumeSchema,
    responses: {
      200: {
        description: 'Details about the historic model volumes.',
        content: {
          'application/json': {
            schema: GetEntryVolumeResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export type GetEntryVolumeResponse = z.infer<typeof GetEntryVolumeResponseSchema>

export const getEntryVolume = [
  async (req: Request, res: Response<GetEntryVolumeResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    const {
      query: { interval, startDate, endDate, timezone },
    } = parse(req, getEntryVolumeSchema)

    const result = await metrics.calculateEntryVolume(req.user, interval, startDate, endDate, timezone)

    await audit.onViewMetric(req)

    res.json(result)
  },
]
