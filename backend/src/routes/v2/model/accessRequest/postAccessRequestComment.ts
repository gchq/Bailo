import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { ResponseInterface } from '../../../../models/Response.js'
import { newAccessRequestComment } from '../../../../services/accessRequest.js'
import { registerPath, responseInterfaceSchema } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postAccessRequestCommentSchema = z.object({
  body: z.object({
    comment: z.string(),
  }),
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}/comment',
  tags: ['access-request'],
  description: 'Add a comment to an access request.',
  schema: postAccessRequestCommentSchema,
  responses: {
    200: {
      description: 'The new access request comment.',
      content: {
        'application/json': {
          schema: z.object({
            accessRequestComment: responseInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostRequestCommentResponse {
  accessRequestComment: ResponseInterface
}

export const postAccessRequestComment = [
  bodyParser.json(),
  async (req: Request, res: Response<PostRequestCommentResponse>) => {
    req.audit = AuditInfo.UpdateAccessRequest
    const {
      body,
      params: { accessRequestId },
    } = parse(req, postAccessRequestCommentSchema)

    const accessRequestComment = await newAccessRequestComment(req.user, accessRequestId, body.comment)

    await audit.onCreateResponse(req, accessRequestComment)

    return res.json({
      accessRequestComment,
    })
  },
]
