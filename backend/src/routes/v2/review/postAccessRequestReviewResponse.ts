import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { Decision, ResponseInterface } from '../../../models/Response.js'
import { respondToReview } from '../../../services/response.js'
import { ReviewKind } from '../../../types/enums.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

const nonConditionalFields = z.object({
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
  body: z.object({
    role: z.string(),
  }),
})

const optionalComment = z.object({
  body: z.object({
    comment: z.string().optional(),
    decision: z.enum(getEnumValues(Decision)).exclude([Decision.RequestChanges]),
  }),
})

const mandatoryComment = z.object({
  body: z.object({
    comment: z.string().min(1, 'A comment must be supplied when requesting changes'),
    decision: z.literal(Decision.RequestChanges),
  }),
})

export const postAccessRequestReviewResponseSchema = z.intersection(
  nonConditionalFields,
  z.union([optionalComment, mandatoryComment]),
)

interface PostAccessRequestReviewResponse {
  response: ResponseInterface
}

export const postAccessRequestReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PostAccessRequestReviewResponse>) => {
    req.audit = AuditInfo.CreateReviewResponse
    const {
      params: { modelId, accessRequestId },
      body: { role, ...body },
    } = parse(req, postAccessRequestReviewResponseSchema)

    const response = await respondToReview(req.user, modelId, role, body, ReviewKind.Access, accessRequestId)

    await audit.onCreateReviewResponse(req, response)

    return res.json({
      response,
    })
  },
]
