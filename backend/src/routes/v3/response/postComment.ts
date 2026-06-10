import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { ResponseInterface } from '../../../models/Response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { newComment } from '../../../services/v3/response.js'
import { ReviewKind } from '../../../types/enums.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

export const postCommentSchema = z.object({
  query: z.object({
    modelId: z.string().openapi({ example: 'test-model-123' }),
    identifier: z.string().optional().openapi({ example: '1.0.0' }),
    kind: z.enum(getEnumValues(ReviewKind)).openapi({ example: ReviewKind.Release }),
  }),
  body: z.object({
    comment: z.string().trim().min(1).max(10000).openapi({ example: 'This is an example comment' }),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v3/response/comment',
  tags: ['release'],
  description: 'Add a comment to a release, access request or model card.',
  schema: postCommentSchema,
  responses: {
    200: {
      description: 'A comment instance.',
      content: {
        'application/json': {
          schema: z.object({
            response: responseInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostReleaseCommentResponse {
  response: ResponseInterface
}

export const postComment = [
  async (req: Request, res: Response<PostReleaseCommentResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateResponse
    const {
      query: { modelId, identifier, kind },
      body,
    } = parse(req, postCommentSchema)

    const comment = await newComment(req.user, modelId, kind, body.comment, identifier)

    await audit.onCreateCommentResponse(req, comment)

    res.json({
      response: comment,
    })
  },
]
