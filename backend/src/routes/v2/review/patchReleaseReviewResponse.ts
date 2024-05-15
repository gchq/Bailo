import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ReviewInterface } from '../../../models/Review.js'
import { updateReviewResponse } from '../../../services/review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { ReviewKind } from '../../../types/enums.js'
import { parse } from '../../../utils/validate.js'

export const patchReleaseReviewResponseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
  body: z.object({
    id: z.string(),
    role: z.string(),
    comment: z.string().optional(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/release/{semver}/review',
  tags: ['review'],
  description: 'Update a review for a release.',
  schema: patchReleaseReviewResponseSchema,
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

interface PatchReleaseReviewResponse {
  review: ReviewInterface
}

export const patchReleaseReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchReleaseReviewResponse>) => {
    req.audit = AuditInfo.UpdateReviewResponse
    const {
      params: { modelId, semver },
      body: { role, ...body },
    } = parse(req, patchReleaseReviewResponseSchema)
    const review = await updateReviewResponse(req.user, modelId, role, body, ReviewKind.Release, semver)

    await audit.onUpdateReviewResponse(req, review)

    return res.json({
      review,
    })
  },
]
