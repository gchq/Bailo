import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { Decision, ResponseInterface } from '../../../models/Response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { respondToReview } from '../../../services/v3/response.js'
import { ReviewKind } from '../../../types/enums.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

export const postReviewResponseSchema = z.object({
  params: z.object({
    reviewId: z.string(),
  }),
  body: z.intersection(
    z.discriminatedUnion('decision', [
      z.object({
        comment: z.string().optional(),
        decision: z.enum(getEnumValues(Decision)).exclude([Decision.RequestChanges]),
      }),
      z.object({
        comment: z.string().min(1, 'A comment must be supplied when requesting changes'),
        decision: z.literal(Decision.RequestChanges),
      }),
    ]),
    z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal(ReviewKind.Lifecycle),
        dueDate: z.coerce
          .date({
            required_error: 'Please provide a next review due date when submitting this review.',
          })
          .refine((date) => date.getTime() > Date.now(), {
            message: 'Due date of next review cannot be in the past.',
          }),
        decision: z.literal(Decision.Approve),
      }),
      z.object({
        kind: z.enum([ReviewKind.Release, ReviewKind.Access]),
      }),
    ]),
  ),
})

registerPath(
  {
    method: 'post',
    path: '/api/v3/review/{reviewId}/response',
    tags: ['review'],
    description: 'Respond to a review',
    schema: postReviewResponseSchema,
    responses: {
      200: {
        description: 'The create review response.',
        content: {
          'application/json': {
            schema: z.object({
              response: responseInterfaceSchema,
            }),
          },
        },
      },
    },
  },
  'v3',
)

interface PostReviewResponse {
  response: ResponseInterface
}

export const postReviewResponse = [
  async (req: Request, res: Response<PostReviewResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateReviewResponse
    const {
      params: { reviewId },
      body: { ...body },
    } = parse(req, postReviewResponseSchema)

    const response = await respondToReview(
      req.user,
      reviewId,
      { decision: body.decision, comment: body.comment },
      body.kind === ReviewKind.Lifecycle ? body.dueDate : undefined,
    )

    await audit.onCreateReviewResponse(req, response)

    res.json({ response })
  },
]
