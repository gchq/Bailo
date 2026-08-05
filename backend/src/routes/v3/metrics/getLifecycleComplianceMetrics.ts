import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getLifecycleComplianceMetricsSchema = z.object({
  query: z
    .object({
      weeksUntilDue: z.string().refine((val) => !Number.isNaN(parseInt(val, 10)), {
        message: 'Expected number, received a string',
      }),
    })
    .strict(),
})

export const LifecycleSummarySchema = z.object({
  count: z.number(),
})

export const EntryLifecycleMetricsSchema = z.object({
  entryId: z.string(),
  dueDate: z.string(),
})

export const LifecycleComplianceBaseMetricsSchema = z.object({
  summary: LifecycleSummarySchema,
  entries: z.array(EntryLifecycleMetricsSchema),
})

export const LifecycleComplianceOrganisationMetricsSchema = LifecycleComplianceBaseMetricsSchema.extend({
  organisation: z.string(),
})

export const BaseLifecycleComplianceMetricsResponseSchema = z.object({
  lastUpdated: z.string(),
  global: LifecycleComplianceBaseMetricsSchema,
  byOrganisation: z.array(LifecycleComplianceOrganisationMetricsSchema),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/metrics/compliance/lifecycle',
    tags: ['metrics'],
    description: 'Retrieve compliance metrics for entries near or past their respective lifecycle review date.',
    schema: getLifecycleComplianceMetricsSchema,
    responses: {
      200: {
        description: 'Current snapshot of entries near or past their lifecycle review date.',
        content: {
          'application/json': {
            schema: BaseLifecycleComplianceMetricsResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export type GetLifecycleComplianceMetricsResponse = z.infer<typeof BaseLifecycleComplianceMetricsResponseSchema>

export const getLifecycleComplianceMetrics = [
  async (req: Request, res: Response<GetLifecycleComplianceMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    const {
      query: { weeksUntilDue },
    } = parse(req, getLifecycleComplianceMetricsSchema)

    const complianceMetrics = await metrics.getLifecycleComplianceMetrics(req.user, parseInt(weeksUntilDue))

    await audit.onViewMetric(req)

    res.json(complianceMetrics)
  },
]
