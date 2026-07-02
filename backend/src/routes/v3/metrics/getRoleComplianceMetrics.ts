import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getRoleComplianceMetricsSchema = z.object({
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

export const RoleComplianceBaseMetricsSchema = z.object({
  summary: z.array(RoleSummarySchema),
  entries: z.array(EntryRoleMetricsSchema),
})

export const RoleComplianceOrganisationMetricsSchema = RoleComplianceBaseMetricsSchema.extend({
  organisation: z.string(),
})

export const GetRoleComplianceMetricsResponseSchema = z.object({
  lastUpdated: z.string(),
  global: RoleComplianceBaseMetricsSchema,
  byOrganisation: z.array(RoleComplianceOrganisationMetricsSchema),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/metrics/compliance/roles',
    tags: ['metrics'],
    description: 'Retrieve compliance metrics for entries missing required review roles.',
    schema: getRoleComplianceMetricsSchema,
    responses: {
      200: {
        description: 'Current snapshot of models with missing releases.',
        content: {
          'application/json': {
            schema: GetRoleComplianceMetricsResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export type GetRoleComplianceMetricsResponse = z.infer<typeof GetRoleComplianceMetricsResponseSchema>

export const getRoleComplianceMetrics = [
  async (req: Request, res: Response<GetRoleComplianceMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getRoleComplianceMetricsSchema)

    const complianceMetrics = await metrics.getRoleComplianceMetrics(req.user)

    await audit.onViewMetric(req)

    res.json(complianceMetrics)
  },
]
