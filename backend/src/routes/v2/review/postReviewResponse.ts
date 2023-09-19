import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { Decision, ReviewInterface } from '../../../models/v2/Review.js'
import { respondToReview } from '../../../services/v2/review.js'
import { parse } from '../../../utils/v2/validate.js'

export const postReviewResponseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
    role: z.string(),
  }),
  body: z.object({
    comment: z.string().optional(),
    decision: z.nativeEnum(Decision),
  }),
})

interface PostReviewResponse {
  review: ReviewInterface
}

export const postReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReviewResponse>) => {
    const {
      params: { modelId, semver, role },
      body,
    } = parse(req, postReviewResponseSchema)
    const review = await respondToReview(req.user, modelId, semver, role, body)
    return res.json({
      review,
    })
  },
]
