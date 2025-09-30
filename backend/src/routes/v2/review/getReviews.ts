import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ReviewInterface } from '../../../models/Review.js'
import { findReviews } from '../../../services/review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { ReviewKind } from '../../../types/enums.js'
import { parse, strictCoerceBoolean } from '../../../utils/validate.js'

export const getReviewsSchema = z.object({
  query: z.object({
    modelId: z.string().optional(),
    semver: z.string().optional(),
    accessRequestId: z.string().optional(),
    kind: z.nativeEnum(ReviewKind).optional(),
    mine: strictCoerceBoolean(z.boolean().optional().default(true)),
    open: strictCoerceBoolean(z.boolean().optional().default(false)),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/reviews',
  tags: ['review'],
  description: 'Find reviews matching criteria.',
  schema: getReviewsSchema,
  responses: {
    200: {
      description: 'An array of review instances.',
      content: {
        'application/json': {
          schema: z.object({
            reviews: z.array(reviewInterfaceSchema),
          }),
        },
      },
    },
  },
})

export interface GetReviewResponse {
  reviews: Array<ReviewInterface>
}

export const getReviews = [
  async (req: Request, res: Response<GetReviewResponse>): Promise<void> => {
    req.audit = AuditInfo.SearchReviews
    const {
      query: { mine, open, modelId, semver, accessRequestId, kind },
    } = parse(req, getReviewsSchema)

    const reviews = await findReviews(req.user, mine, open, modelId, semver, accessRequestId, kind)
    await audit.onSearchReviews(req, reviews)

    res.setHeader('x-count', reviews.length)
    res.json({ reviews })
  },
]
