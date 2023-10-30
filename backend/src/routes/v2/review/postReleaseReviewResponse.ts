import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { Decision, ReviewInterface } from '../../../models/v2/Review.js'
import { respondToReview } from '../../../services/v2/review.js'
import { ReviewKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const postReleaseReviewResponseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
  body: z.object({
    role: z.string(),
    comment: z.string().optional(),
    decision: z.nativeEnum(Decision),
  }),
})

interface PostReleaseReviewResponse {
  review: ReviewInterface
}

export const postReleaseReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseReviewResponse>) => {
    const {
      params: { modelId, semver },
      body: { role, ...body },
    } = parse(req, postReleaseReviewResponseSchema)

    const review = await respondToReview(req.user, modelId, role, body, ReviewKind.Release, semver)

    return res.json({
      review,
    })
  },
]
