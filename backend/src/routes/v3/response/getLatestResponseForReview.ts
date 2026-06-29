import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { ResponseInterface } from '../../../models/Response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { getLatestResponseForReview } from '../../../services/v3/response.js'
import { parse } from '../../../utils/validate.js'

export const getLatestResponseSchema = z.object({
  params: z.object({
    reviewId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid review id'),
  }),
})

registerPath(
  {
    method: 'get',
    path: '/api/v3/review/{reviewId}/responses/latest',
    tags: ['response'],
    description: 'Get the latest response for a review',
    schema: getLatestResponseSchema,
    responses: {
      200: {
        description: 'A review response.',
        content: {
          'application/json': {
            schema: z.object({
              response: responseInterfaceSchema,
            }),
          },
        },
      },
    },
  },
  'v3',
)

interface GetLatestResponseResponse {
  response: ResponseInterface
}

export const getLatestResponse = [
  async (req: Request, res: Response<GetLatestResponseResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewResponses
    const {
      params: { reviewId },
    } = parse(req, getLatestResponseSchema)

    const response = await getLatestResponseForReview(reviewId)
    await audit.onViewResponses(req, [response])

    res.json({
      response,
    })
  },
]
