import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { Decision, ReviewInterface } from '../../../models/Review.js'
import { updateReviewResponse } from '../../../services/review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { ReviewKind } from '../../../types/enums.js'
import { parse } from '../../../utils/validate.js'

export const patchAccessRequestReviewResponseSchema = z.object({
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

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/access-request/{AccessRequestId}/review',
  tags: ['access-request', 'review'],
  description: 'Update a review for a access request.',
  schema: patchAccessRequestReviewResponseSchema,
  responses: {
    200: {
      description: 'A review instance.',
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

interface PatchAccessRequestReviewResponse {
  review: ReviewInterface
}

export const patchAccessRequestReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchAccessRequestReviewResponse>) => {
    req.audit = AuditInfo.UpdateReviewResponse
    const {
      params: { modelId, accessRequestId },
      body: { role, ...body },
    } = parse(req, patchAccessRequestReviewResponseSchema)
    const review = await updateReviewResponse(req.user, modelId, role, ReviewKind.Release, accessRequestId, body)

    await audit.onUpdateReviewResponse(req, review)

    return res.json({
      review,
    })
  },
]
