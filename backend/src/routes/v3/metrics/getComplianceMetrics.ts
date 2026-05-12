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

export const RoleIdentitySchema = z.object({
  roleId: z.string(),
  roleName: z.string(),
})

export const RoleSummarySchema = RoleIdentitySchema.extend({
  count: z.number(),
})

export const EntryRoleMetricsSchema = z.object({
  entryId: z.string(),
  missingRoles: z.array(RoleIdentitySchema),
})

export const ComplianceBaseMetricsSchema = z.object({
  summary: z.array(RoleSummarySchema),
  entries: z.array(EntryRoleMetricsSchema),
})

export const ComplianceOrganisationMetricsSchema = ComplianceBaseMetricsSchema.extend({
  organisation: z.string(),
})

export const GetComplianceMetricsResponseSchema = z.object({
  lastUpdated: z.string(),
  global: ComplianceBaseMetricsSchema,
  byOrganisation: z.array(ComplianceOrganisationMetricsSchema),
})

registerPath({
  method: 'get',
  path: '/api/v3/metrics/compliance',
  tags: ['metrics'],
  description: 'Retrieve current point-in-time system and usage metrics.',
  schema: getUsageMetricsSchema,
  responses: {
    200: {
      description: 'Current snapshot of system metrics.',
      content: {
        'application/json': {
          schema: GetComplianceMetricsResponseSchema,
        },
      },
    },
  },
})

export type GetComplianceMetricsResponse = z.infer<typeof GetComplianceMetricsResponseSchema>

export const getComplianceMetrics = [
  async (req: Request, res: Response<GetComplianceMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getUsageMetricsSchema)

    const complianceMetrics = await metrics.getComplianceMetrics(req.user)

    await audit.onViewMetric(req)

    res.json(complianceMetrics)
  },
]
