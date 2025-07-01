import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { Decision, ResponseInterface } from '../../../models/Response.js'
import { respondToReview } from '../../../services/response.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/specification.js'
import { ReviewKind } from '../../../types/enums.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

const staticProperties = z.object({
  role: z.string(),
})

const optionalComment = z.object({
  comment: z.string().optional(),
  decision: z.enum(getEnumValues(Decision)).exclude([Decision.RequestChanges]),
})

const mandatoryComment = z.object({
  comment: z.string().min(1, 'A comment must be supplied when requesting changes'),
  decision: z.literal(Decision.RequestChanges),
})

export const postAccessRequestReviewResponseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
  body: z.discriminatedUnion('decision', [
    staticProperties.merge(optionalComment),
    staticProperties.merge(mandatoryComment),
  ]),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}/review',
  tags: ['access-request', 'review'],
  description: 'Send a review for an access request.',
  schema: postAccessRequestReviewResponseSchema,
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

interface PostAccessRequestReviewResponse {
  response: ResponseInterface
}

export const postAccessRequestReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PostAccessRequestReviewResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateReviewResponse
    const {
      params: { modelId, accessRequestId },
      body: { role, ...body },
    } = parse(req, postAccessRequestReviewResponseSchema)

    const response = await respondToReview(req.user, modelId, role, body, ReviewKind.Access, accessRequestId)

    await audit.onCreateReviewResponse(req, response)

    res.json({
      response,
    })
  },
]
