import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getUsageMetricsSchema = z.object({
  query: z.object({}).strict(),
})

export const SchemaInfoSchema = z.object({
  schemaId: z.string(),
  schemaName: z.string(),
  count: z.number(),
})

export const StateInfoSchema = z.object({
  state: z.string(),
  count: z.number(),
})

export const BaseMetricsSchema = z.object({
  users: z.number().optional(),
  models: z.number(),
  schemaBreakdown: z.array(SchemaInfoSchema),
  modelState: z.array(StateInfoSchema),
  withReleases: z.number(),
  withAccessRequest: z.number(),
})

export const OrganisationMetricsSchema = BaseMetricsSchema.extend({
  organisation: z.string(),
})

export const GetUsageMetricsResponseSchema = z.object({
  global: BaseMetricsSchema,
  byOrganisation: z.array(OrganisationMetricsSchema),
})

registerPath({
  method: 'get',
  path: '/api/v3/metrics/usage',
  tags: ['metrics'],
  description: 'Retrieve current point-in-time system and usage metrics.',
  schema: getUsageMetricsSchema,
  responses: {
    200: {
      description: 'Current snapshot of system metrics.',
      content: {
        'application/json': {
          schema: GetUsageMetricsResponseSchema,
        },
      },
    },
  },
})

export type SchemaInfo = z.infer<typeof SchemaInfoSchema>
export type StateInfo = z.infer<typeof StateInfoSchema>
export type BaseMetrics = z.infer<typeof BaseMetricsSchema>
export type OrganisationMetrics = z.infer<typeof OrganisationMetricsSchema>
export type GetUsageMetricsResponse = z.infer<typeof GetUsageMetricsResponseSchema>

export const getUsageMetrics = [
  async (req: Request, res: Response<GetUsageMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getUsageMetricsSchema)

    const usageMetrics = await metrics.getUsageMetrics(req.user)

    await audit.onViewMetric(req)

    res.json(usageMetrics)
  },
]
