import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { ReviewInterface } from '../../../models/Review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { createReview } from '../../../services/v3/review.js'
import { ReviewKind } from '../../../types/enums.js'
import { parse } from '../../../utils/validate.js'

export const postReviewSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal(ReviewKind.Lifecycle),
      dueDate: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
        message: 'Due date of next review cannot be in the past.',
      }),
    }),
    z.object({
      kind: z.literal(ReviewKind.Release),
      semver: z.string(),
    }),
    z.object({
      kind: z.literal(ReviewKind.Access),
      accessRequestId: z.string(),
    }),
  ]),
})

registerPath(
  {
    method: 'post',
    path: '/api/v3/review/{modelId}',
    tags: ['review'],
    description: 'Create a new review',
    schema: postReviewSchema,
    responses: {
      200: {
        description: 'The created review.',
        content: {
          'application/json': {
            schema: z.object({
              review: reviewInterfaceSchema,
            }),
          },
        },
      },
    },
  },
  'v3',
)

interface PostReviewResponse {
  review: ReviewInterface | undefined
}

export const postReview = [
  async (req: Request, res: Response<PostReviewResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateReview
    const {
      params: { modelId },
      body: { ...body },
    } = parse(req, postReviewSchema)

    const review = await createReview(req.user, modelId, { ...body })

    await audit.onCreateReview(req, modelId)

    res.json({ review })
  },
]
