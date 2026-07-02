import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getNoReleaseComplianceMetricsSchema = z.object({
  query: z.object({}).strict(),
})

export const NoReleaseSummaryMetricsSchema = z.object({
  modelsWithNoReleases: z.number(),
})

export const ModelsNoReleasesSchema = z.object({
  id: z.string(),
  organisation: z.string(),
  owners: z.array(z.string()),
})

export const GlobalNoReleaseMetricsSchema = z.object({
  summary: NoReleaseSummaryMetricsSchema,
  models: z.array(ModelsNoReleasesSchema),
})

export const NoReleaseMetricsByOrgSchema = z.object({
  organisation: z.string(),
  summary: NoReleaseSummaryMetricsSchema,
  models: z.array(ModelsNoReleasesSchema),
})

export const BaseNoReleaseMetricsSchema = z.object({
  global: GlobalNoReleaseMetricsSchema,
  byOrganisation: z.array(NoReleaseMetricsByOrgSchema),
  lastUpdated: z.string(),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/metrics/compliance/no-releases',
    tags: ['metrics'],
    description: 'Retrieve current point-in-time system and usage metrics.',
    schema: getNoReleaseComplianceMetricsSchema,
    responses: {
      200: {
        description: 'Current snapshot of system metrics.',
        content: {
          'application/json': {
            schema: BaseNoReleaseMetricsSchema,
          },
        },
      },
    },
  },
  'v3',
)

export type GetNoReleaseComplianceMetricsResponse = z.infer<typeof BaseNoReleaseMetricsSchema>

export const getNoReleasesComplianceMetrics = [
  async (req: Request, res: Response<GetNoReleaseComplianceMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getNoReleaseComplianceMetricsSchema)

    const complianceMetrics = await metrics.getNoReleasesMetrics(req.user)

    await audit.onViewMetric(req)

    res.json(complianceMetrics)
  },
]
