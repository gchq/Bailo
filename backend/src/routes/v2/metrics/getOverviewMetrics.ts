import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { Roles } from '../../../connectors/authentication/constants.js'
import authentication from '../../../connectors/authentication/index.js'
import { z } from '../../../lib/zod.js'
import { calculateOverviewMetrics } from '../../../services/metrics.js'
import { registerPath } from '../../../services/specification.js'
import { Forbidden } from '../../../utils/error.js'
import { parse } from '../../../utils/validate.js'

export const getOverviewMetricsSchema = z.object({
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

export const GetOverviewMetricsResponseSchema = z.object({
  global: BaseMetricsSchema,
  byOrganisation: z.array(OrganisationMetricsSchema),
})

registerPath({
  method: 'get',
  path: '/api/v3/metrics',
  tags: ['metrics'],
  description: 'Retrieve current point-in-time system and usage metrics.',
  schema: getOverviewMetricsSchema,
  responses: {
    200: {
      description: 'Current snapshot of system metrics.',
      content: {
        'application/json': {
          schema: GetOverviewMetricsResponseSchema,
        },
      },
    },
  },
})

export type SchemaInfo = z.infer<typeof SchemaInfoSchema>
export type StateInfo = z.infer<typeof StateInfoSchema>
export type BaseMetrics = z.infer<typeof BaseMetricsSchema>
export type OrganisationMetrics = z.infer<typeof OrganisationMetricsSchema>
export type GetOverviewMetricsResponse = z.infer<typeof GetOverviewMetricsResponseSchema>

export const getOverviewMetrics = [
  async (req: Request, res: Response<GetOverviewMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    if (!(await authentication.hasRole(req.user, Roles.Admin))) {
      throw Forbidden('You do not have the required role.', {
        userDn: req.user.dn,
        requiredRole: Roles.Admin,
      })
    }

    parse(req, getOverviewMetricsSchema)

    const metrics = await calculateOverviewMetrics()

    await audit.onViewMetric(req)

    res.json(metrics)
  },
]
