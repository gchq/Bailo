import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { calculateOverviewMetrics } from '../../../services/metrics.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getOverviewMetricsSchema = z.object({
  query: z.object({}).strict(),
})

registerPath({
  method: 'get',
  path: '/api/v2/metrics',
  tags: ['metrics'],
  description: 'Retrieve current point-in-time system and usage metrics.',
  schema: getOverviewMetricsSchema,
  responses: {
    200: {
      description: 'Current snapshot of system metrics.',
      content: {
        'application/json': {
          schema: z.object({
            usersTotal: z.number(),
            activeUsers: z.number(),
            storageUsedGb: z.number(),
          }),
        },
      },
    },
  },
})

export interface SchemaInfo {
  schemaId: string
  schemaName: string
  count: number
}
export interface StateInfo {
  state: string
  count: number
}

export interface BaseMetrics {
  users: number
  models: number
  schemaBreakdown: SchemaInfo[]
  modelState: StateInfo[]
  withReleases: number
  withAccessRequest: number
}

export interface OrganisationMetrics extends BaseMetrics {
  organisation: string
}

export interface GetOverviewMetricsResponse {
  global: BaseMetrics
  byOrganisation: OrganisationMetrics[]
}

export const getOverviewMetrics = [
  async (req: Request, res: Response<GetOverviewMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getOverviewMetricsSchema)

    const metrics = await calculateOverviewMetrics()

    await audit.onViewMetric(req)

    res.json(metrics)
  },
]
