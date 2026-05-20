import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { Decision, ResponseInterface } from '../../../models/Response.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { respondToReview } from '../../../services/v3/response.js'
import { ReviewKind } from '../../../types/enums.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

const staticProperties = z.object({
  role: z.string(),
  modelId: z.string(),
})

const optionalComment = z.object({
  comment: z.string().optional(),
  decision: z.enum(getEnumValues(Decision)).exclude([Decision.RequestChanges]),
})

const mandatoryComment = z.object({
  comment: z.string().min(1, 'A comment must be supplied when requesting changes'),
  decision: z.literal(Decision.RequestChanges),
})

const mandatoryDueDate = z.object({
  dueDate: z.coerce.date(),
  kind: z.literal(ReviewKind.Lifecycle),
})

const optionalDueDate = z.object({
  dueDate: z.coerce.date().optional(),
  kind: z.enum([ReviewKind.Release, ReviewKind.Access]),
})

export const postReviewResponseSchema = z.object({
  params: z.object({
    reviewId: z.string(),
  }),
  body: z.intersection(
    z.discriminatedUnion('decision', [
      staticProperties.merge(optionalComment),
      staticProperties.merge(mandatoryComment),
    ]),
    z.union([mandatoryDueDate, optionalDueDate]),
  ),
})

registerPath({
  method: 'post',
  path: '/api/v3/review/{reviewId}/response/',
  tags: ['review'],
  description: 'Respond to a review',
  schema: postReviewResponseSchema,
  responses: {
    200: {
      description: 'The created review instance.',
      content: {
        'application/json': {
          schema: z.object({
            review: reviewInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostReviewResponse {
  response: ResponseInterface
}

export const postReviewResponse = [
  async (req: Request, res: Response<PostReviewResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateReviewResponse
    const {
      params: { reviewId },
      body: { role, modelId, ...body },
    } = parse(req, postReviewResponseSchema)

    const response = await respondToReview(
      req.user,
      reviewId,
      modelId,
      role,
      { decision: body.decision, comment: body.comment },
      body.dueDate,
    )

    await audit.onCreateReviewResponse(req, response)

    res.json({ response })
  },
]
