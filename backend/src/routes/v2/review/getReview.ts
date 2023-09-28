import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReviewInterface } from '../../../models/v2/Review.js'
import { findReviews } from '../../../services/v2/review.js'
import { parse, strictCoerceBoolean } from '../../../utils/v2/validate.js'

export const getReviewSchema = z.object({
  params: z.object({
    modelId: strictCoerceBoolean(z.boolean()),
  }),
})

interface GetReviewResponse {
  review: ReviewInterface
}

export const getReviews = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getReviewSchema)
    const reviews = await findReviews(req.user, true, modelId)
    res.setHeader('x-count', reviews.length)
    return res.json({
      review: reviews[0],
    })
  },
]
