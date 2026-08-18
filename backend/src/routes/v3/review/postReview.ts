import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { ReviewInterface } from '../../../models/Review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { createReview, isLifecycleReviewDateValid } from '../../../services/v3/review.js'
import { ReviewKind } from '../../../types/enums.js'
import config from '../../../utils/config.js'
import { parse } from '../../../utils/validate.js'

export const postReviewSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal(ReviewKind.Lifecycle),
      dueDate: z.coerce
        .date()
        .refine((date) => isLifecycleReviewDateValid(date), {
          message: `Due date of next review cannot be further than ${config.ui.lifecycle.maxReviewInterval} in the future.`,
        })
        .refine((date) => date.getTime() < Date.UTC(2000), {
          message: 'Due date of next review cannot be before year 2000.',
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
