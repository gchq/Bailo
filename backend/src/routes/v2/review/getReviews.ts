import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { ModelInterface } from '../../../models/Model.js'
import { ReviewInterface } from '../../../models/Review.js'
import { findReviews } from '../../../services/v2/review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/v2/specification.js'
import { ReviewKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const getReviewsSchema = z.object({
  query: z.object({
    modelId: z.string().optional(),
    semver: z.string().optional(),
    accessRequestId: z.string().optional(),
    kind: z.nativeEnum(ReviewKind).optional(),
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

interface GetReviewResponse {
  reviews: Array<ReviewInterface & { model: ModelInterface }>
}

export const getReviews = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewResponse>) => {
    req.audit = AuditInfo.SearchReviews
    const {
      query: { modelId, semver, accessRequestId, kind },
    } = parse(req, getReviewsSchema)

    const reviews = await findReviews(req.user, modelId, semver, accessRequestId, kind)
    await audit.onSearchReviews(req, reviews)

    res.setHeader('x-count', reviews.length)
    return res.json({
      reviews,
    })
  },
]
