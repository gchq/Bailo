import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReviewInterface } from '../../../models/v2/Review.js'
import { findReviewsByActive } from '../../../services/v2/review.js'
import { parse, strictCoerceBoolean } from '../../../utils/v2/validate.js'

export const getReviewSchema = z.object({
  query: z.object({
    active: strictCoerceBoolean(z.boolean()),
  }),
})

interface GetReviewResponse {
  reviews: Array<ReviewInterface>
}

export const getReviews = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewResponse>) => {
    const {
      query: { active },
    } = parse(req, getReviewSchema)
    const reviews = await findReviewsByActive(req.user, active)
    return res.json({
      reviews,
    })
  },
]
