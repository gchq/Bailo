import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { countReviews } from '../../../services/v2/review.js'

interface GetReviewsCountResponse {
  count: number
}

export const getReviewsCount = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewsCountResponse>) => {
    const count = await countReviews(req.user)
    return res.json({
      count,
    })
  },
]
