import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { countReviewRequests } from '../../../services/v2/review.js'

interface GetReviewRequestsCountResponse {
  count: number
}

export const getReviewRequestsCount = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewRequestsCountResponse>) => {
    const count = await countReviewRequests(req.user)
    return res.json({
      count,
    })
  },
]
