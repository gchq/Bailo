import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getNoReleasesComplianceMetricsSchema = z.object({})

export const NoReleasesSummaryMetricsSchema = z.object({
  modelsWithNoReleases: z.number(),
})

export const ModelsNoReleasesSchema = z.object({
  entryId: z.string().openapi({ example: 'my-model-213gj' }),
  organisation: z.string().openapi({ example: 'Example Organisation' }),
  modelOwners: z.array(z.string()).openapi({ example: ['user:user'] }),
})

export const GlobalNoReleasesMetricsSchema = z.object({
  summary: NoReleasesSummaryMetricsSchema,
  models: z.array(ModelsNoReleasesSchema),
})

export const NoReleaseMetricsByOrgSchema = z.object({
  organisation: z.string().openapi({ example: 'Example Organisation' }),
  summary: NoReleasesSummaryMetricsSchema,
  models: z.array(ModelsNoReleasesSchema),
})

export const BaseNoReleaseMetricsSchema = z.object({
  global: GlobalNoReleasesMetricsSchema,
  byOrganisation: z.array(NoReleaseMetricsByOrgSchema),
  lastUpdated: z.string().openapi({ example: new Date().toISOString() }),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/metrics/compliance/no-releases',
    tags: ['metrics'],
    description: 'Retrieve compliance metrics for models that do not have any releases.',
    schema: getNoReleasesComplianceMetricsSchema,
    responses: {
      200: {
        description: 'Current snapshot of all models with no releases attached to them.',
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

export type GetNoReleasesComplianceMetricsResponse = z.infer<typeof BaseNoReleaseMetricsSchema>

export const getNoReleasesComplianceMetrics = [
  async (req: Request, res: Response<GetNoReleasesComplianceMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getNoReleasesComplianceMetricsSchema)

    const complianceMetrics = await metrics.getNoReleasesMetrics(req.user)

    await audit.onViewMetric(req)

    res.json(complianceMetrics)
  },
]
