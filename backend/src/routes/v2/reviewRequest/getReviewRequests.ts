import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReviewRequestInterface } from '../../../models/v2/ReviewRequest.js'
import { findReviewRequestsByActive } from '../../../services/v2/review.js'
import { parse, strictCoerceBoolean } from '../../../utils/v2/validate.js'

export const getReviewRequestsSchema = z.object({
  query: z.object({
    active: strictCoerceBoolean(z.boolean()),
  }),
})

interface GetReviewRequestsResponse {
  reviewRequests: Array<ReviewRequestInterface>
}

export const getReviewRequests = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewRequestsResponse>) => {
    const { query: { active } } = parse(req, getReviewRequestsSchema)
    const reviewRequests = await findReviewRequestsByActive(req.user, active)
    return res.json({
      reviewRequests,
    })
  },
]
