import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ModelInterface } from '../../../models/Model.js'
import { ResponseInterface } from '../../../models/Response.js'
import { ReviewInterface } from '../../../models/Review.js'
import { findResponsesById } from '../../../services/response.js'
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
  reviews: Array<ReviewInterface & { model: ModelInterface; responses: ResponseInterface[] }>
}

export const getReviews = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewResponse>) => {
    req.audit = AuditInfo.SearchReviews
    const {
      query: { mine, modelId, semver, accessRequestId, kind },
    } = parse(req, getReviewsSchema)

    const reviewsWithoutResponses = await findReviews(req.user, mine, modelId, semver, accessRequestId, kind)
    await audit.onSearchReviews(req, reviewsWithoutResponses)

    const reviews = reviewsWithoutResponses.map(async (review) => {
      const responsesForReview = await findResponsesById(req.user, review.responseIds)
      return { ...review, responses: responsesForReview }
    })

    res.setHeader('x-count', reviews.length)
    // TODO fix typing
    return res.json({ reviews: await Promise.all(reviews) })
  },
]
