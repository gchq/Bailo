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
  approvals: Array<ReviewRequestInterface>
}

export const getReviewRequests = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewRequestsResponse>) => {
    const { query } = parse(req, getReviewRequestsSchema)
    const approvals = await findReviewRequestsByActive(req.user, query.active)
    return res.json({
      approvals,
    })
  },
]
