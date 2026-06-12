import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { ResponseInterface } from '../../../models/Response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { newComment } from '../../../services/v3/response.js'
import { ReviewKind } from '../../../types/enums.js'
import { parse } from '../../../utils/validate.js'

export const postCommentSchema = z.object({
  query: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal(ReviewKind.Release).openapi({ example: ReviewKind.Release }),
      modelId: z.string().openapi({ example: 'test-model-123' }),
      identifier: z.string().openapi({
        example: '1.0.0',
        description: 'Semantic version identifying the release.',
      }),
    }),
    z.object({
      kind: z.literal(ReviewKind.Access).openapi({ example: ReviewKind.Access }),
      modelId: z.string().openapi({ example: 'test-model-123' }),
      identifier: z.string().openapi({
        example: 'access-req-456',
        description: 'Access request identifier.',
      }),
    }),
    z.object({
      kind: z.literal(ReviewKind.Lifecycle).openapi({ example: ReviewKind.Lifecycle }),
      modelId: z.string().openapi({ example: 'test-model-123' }),
      identifier: z.undefined().openapi({
        description: 'Not used for lifecycle comments.',
      }),
    }),
  ]),
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
