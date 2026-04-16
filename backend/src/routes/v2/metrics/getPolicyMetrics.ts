import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { calculatePolicyMetrics } from '../../../services/metrics.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getOverviewMetricsSchema = z.object({
  query: z.object({}).strict(),
})

registerPath({
  method: 'get',
  path: '/api/v2/metrics/policy',
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

export interface RoleSummary {
  role: string
  count: number
}

export interface ModelRoleMetrics {
  modelId: string
  missingRoles: string[]
}

export interface BaseMetrics {
  summary: RoleSummary[]
  models: ModelRoleMetrics[]
}

export interface OrganisationMetrics extends BaseMetrics {
  organisation: string
}

export interface GetPolicyMetricsResponse {
  global: BaseMetrics
  byOrganisation: OrganisationMetrics[]
}

export const getPolicyMetrics = [
  async (req: Request, res: Response<GetPolicyMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getOverviewMetricsSchema)

    const metrics = await calculatePolicyMetrics()

    await audit.onViewMetric(req)

    res.json(metrics)
  },
]
