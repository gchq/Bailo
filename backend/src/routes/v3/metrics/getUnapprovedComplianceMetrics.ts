import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getUnapprovedComplianceMetricsSchema = z.object({
  query: z.object({}).strict(),
})

export const UnapprovedSummarySchema = z.object({
  totalModelsWithUnapprovedReleases: z.number(),
  totalUnapprovedReleases: z.number(),
})

export const EntryUnapprovedMetricsSchema = z.object({
  entryId: z.string(),
  modelOwners: z.array(z.string()),
  unapprovedReleases: z.array(z.string()),
})

export const UnapprovedComplianceBaseMetricsSchema = z.object({
  summary: UnapprovedSummarySchema,
  entries: z.array(EntryUnapprovedMetricsSchema),
})

export const UnapprovedComplianceOrganisationMetricsSchema = z.object({
  organisation: z.string(),
  modelsWithUnapprovedReleases: z.number(),
  entries: z.array(EntryUnapprovedMetricsSchema),
})

export const GetUnapprovedComplianceMetricsResponseSchema = z.object({
  lastUpdated: z.string(),
  global: UnapprovedComplianceBaseMetricsSchema,
  byOrganisation: z.array(UnapprovedComplianceOrganisationMetricsSchema),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/metrics/compliance/unapproved',
    tags: ['metrics'],
    description: 'Retrieve compliance metrics for entries with releases that are missing reviews.',
    schema: getUnapprovedComplianceMetricsSchema,
    responses: {
      200: {
        description: 'Current snapshot of entries with releases that are missing reviews.',
        content: {
          'application/json': {
            schema: GetUnapprovedComplianceMetricsResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export type GetUnapprovedComplianceMetricsResponse = z.infer<typeof GetUnapprovedComplianceMetricsResponseSchema>

export const getUnapprovedComplianceMetrics = [
  async (req: Request, res: Response<GetUnapprovedComplianceMetricsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getUnapprovedComplianceMetricsSchema)

    const unapprovedMetrics = await metrics.getUnapprovedComplianceMetrics(req.user)

    await audit.onViewMetric(req)

    res.json(unapprovedMetrics)
  },
]
