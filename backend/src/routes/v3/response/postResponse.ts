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
    modelId: z.string(),
    identifier: z.string().optional(),
    kind: z.enum(getEnumValues(ReviewKind)),
  }),
  body: z.object({
    comment: z.string(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/response/comment',
  tags: ['release'],
  description: 'Add a comment to a model release.',
  schema: postCommentSchema,
  responses: {
    200: {
      description: 'A release comment instance.',
      content: {
        'application/json': {
          schema: z.object({
            release: responseInterfaceSchema,
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

    const releaseComment = await newComment(req.user, modelId, kind, body.comment, identifier)

    await audit.onCreateCommentResponse(req, releaseComment)

    res.json({
      response: releaseComment,
    })
  },
]
