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

export const RoleSummarySchema = z.object({
  role: z.string(),
  count: z.number(),
})

export const ModelRoleMetricsSchema = z.object({
  modelId: z.string(),
  missingRoles: z.array(z.string()),
})

export const PolicyBaseMetricsSchema = z.object({
  summary: z.array(RoleSummarySchema),
  models: z.array(ModelRoleMetricsSchema),
})

export const PolicyOrganisationMetricsSchema = PolicyBaseMetricsSchema.extend({
  organisation: z.string(),
})

export const GetPolicyMetricsResponseSchema = z.object({
  global: PolicyBaseMetricsSchema,
  byOrganisation: z.array(PolicyOrganisationMetricsSchema),
})

export type RoleSummary = z.infer<typeof RoleSummarySchema>
export type ModelRoleMetrics = z.infer<typeof ModelRoleMetricsSchema>
export type PolicyBaseMetrics = z.infer<typeof PolicyBaseMetricsSchema>
export type PolicyOrganisationMetrics = z.infer<typeof PolicyOrganisationMetricsSchema>
export type GetPolicyMetricsResponse = z.infer<typeof GetPolicyMetricsResponseSchema>

export const getPolicyMetrics = [
  async (req: Request, res: Response<GetPolicyMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getOverviewMetricsSchema)

    const metrics = await calculatePolicyMetrics()

    await audit.onViewMetric(req)

    res.json(metrics)
  },
]
