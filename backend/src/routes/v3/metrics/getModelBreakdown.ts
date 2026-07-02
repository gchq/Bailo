import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import metrics from '../../../connectors/metrics/index.js'
import { z } from '../../../lib/zod.js'
import { registerPath } from '../../../services/specification.js'
import { MetricsEntrySearchOptionsParams, MetricsEntrySearchOptionsSchema } from '../../../types/types.js'
import { parse } from '../../../utils/validate.js'

export const getModelBreakdownSchema = z.object({
  query: MetricsEntrySearchOptionsSchema,
})

export const GetModelBreakdownResponseSchema = z.array(
  z.object({
    entryId: z.string(),
    entryName: z.string(),
    collaborators: z.array(
      z.object({
        entity: z.string().openapi({ example: 'user:user' }),
        roles: z.array(z.string()).openapi({ example: ['owner', 'contributor'] }),
      }),
    ),
  }),
)

registerPath(
  {
    method: 'get',
    path: '/api/v3/metrics/breakdown',
    tags: ['metrics'],
    description: 'Retrieve the model breakdown for a given query.',
    schema: getModelBreakdownSchema,
    responses: {
      200: {
        description: 'The breakdown of models for the provided query.',
        content: {
          'application/json': {
            schema: GetModelBreakdownResponseSchema,
          },
        },
      },
    },
  },
  'v3',
)

export type GetModelBreakdownResponse = z.infer<typeof GetModelBreakdownResponseSchema>

export const getModelBreakdown = [
  async (req: Request, res: Response<GetModelBreakdownResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewMetric

    parse(req, getModelBreakdownSchema)

    const opts: { query: MetricsEntrySearchOptionsParams } = parse(req, getModelBreakdownSchema)

    const modelBreakdown = await metrics.calculateModelBreakdown(req.user, opts.query)

    await audit.onViewMetric(req)

    res.json(modelBreakdown)
  },
]
