import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { Roles } from '../../../connectors/authentication/constants.js'
import authentication from '../../../connectors/authentication/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { Forbidden } from '../../../utils/error.js'
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

export const ModelRoleMetricsSchema = z.object({
  modelId: z.string(),
  missingRoles: z.array(RoleIdentitySchema),
})

export const ComplianceBaseMetricsSchema = z.object({
  summary: z.array(RoleSummarySchema),
  models: z.array(ModelRoleMetricsSchema),
})

export const ComplianceOrganisationMetricsSchema = ComplianceBaseMetricsSchema.extend({
  organisation: z.string(),
})

export const GetComplianceMetricsResponseSchema = z.object({
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

export type RoleSummary = z.infer<typeof RoleSummarySchema>
export type ModelRoleMetrics = z.infer<typeof ModelRoleMetricsSchema>
export type ComplianceBaseMetrics = z.infer<typeof ComplianceBaseMetricsSchema>
export type ComplianceOrganisationMetrics = z.infer<typeof ComplianceOrganisationMetricsSchema>
export type GetComplianceMetricsResponse = z.infer<typeof GetComplianceMetricsResponseSchema>

export const getComplianceMetrics = [
  async (req: Request, res: Response<GetComplianceMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    if (!(await authentication.hasRole(req.user, Roles.Admin))) {
      throw Forbidden('You do not have the required role.', {
        userDn: req.user.dn,
        requiredRole: Roles.Admin,
      })
    }

    parse(req, getUsageMetricsSchema)

    const complianceMetrics = await metrics.getComplianceMetrics()

    await audit.onViewMetric(req)

    res.json(complianceMetrics)
  },
]
