import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelInterface } from '../../../models/v2/Model.js'
import { ReviewInterface } from '../../../models/v2/Review.js'
import { findReviews } from '../../../services/v2/review.js'
import { ReviewKind } from '../../../types/v2/enums.js'
import { parse, strictCoerceBoolean } from '../../../utils/v2/validate.js'

export const getReviewsSchema = z.object({
  query: z.object({
    active: strictCoerceBoolean(z.boolean()),
    modelId: z.string().optional(),
    semver: z.string().optional(),
    accessRequestId: z.string().optional(),
    kind: z.nativeEnum(ReviewKind).optional(),
  }),
})

interface GetReviewResponse {
  reviews: Array<ReviewInterface & { model: ModelInterface }>
}

export const getReviews = [
  bodyParser.json(),
  async (req: Request, res: Response<GetReviewResponse>) => {
    const {
      query: { active, modelId, semver, accessRequestId, kind },
    } = parse(req, getReviewsSchema)
    const reviews = await findReviews(req.user, active, modelId, semver, accessRequestId, kind)
    res.setHeader('x-count', reviews.length)
    return res.json({
      reviews,
    })
  },
]
