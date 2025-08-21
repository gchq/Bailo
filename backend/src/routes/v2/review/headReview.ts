import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { findReviews } from '../../../services/review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'
import type { GetReviewResponse } from './getReviews.js'
import { getReviewsSchema } from './getReviews.js'

export const headReviewsSchema = getReviewsSchema

registerPath({
  method: 'head',
  path: '/api/v2/reviews',
  tags: ['review'],
  description: 'Finds reviews header data matching criteria.',
  schema: headReviewsSchema,
  responses: {
    200: {
      description: 'Headers only, no data returned.',
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

type HeadReviewResponse = GetReviewResponse

export const headReviews = [
  bodyParser.json(),
  async (req: Request, res: Response<HeadReviewResponse>): Promise<void> => {
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
