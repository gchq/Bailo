import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { Decision, ReviewInterface } from '../../../models/v2/Review.js'
import { WebhookEvent } from '../../../models/v2/Webhook.js'
import { respondToReview } from '../../../services/v2/review.js'
import { sendWebhooks } from '../../../services/v2/webhook.js'
import { ReviewKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const postAccessRequestReviewResponseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
  body: z.object({
    role: z.string(),
    comment: z.string().optional(),
    decision: z.nativeEnum(Decision),
  }),
})

interface PostAccessRequestReviewResponse {
  review: ReviewInterface
}

export const postAccessRequestReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PostAccessRequestReviewResponse>) => {
    req.audit = AuditInfo.CreateReviewResponse
    const {
      params: { modelId, accessRequestId },
      body: { role, ...body },
    } = parse(req, postAccessRequestReviewResponseSchema)

    const review = await respondToReview(req.user, modelId, role, body, ReviewKind.Access, accessRequestId)

    await audit.onCreateReviewResponse(req, review)
    await sendWebhooks(
      review.modelId,
      WebhookEvent.CreateReviewResponse,
      `User ${review.responses[0].user} has reviewed Access Request ${review.accessRequestId} for Model ${review.modelId}`,
      { review },
    )

    return res.json({
      review,
    })
  },
]
