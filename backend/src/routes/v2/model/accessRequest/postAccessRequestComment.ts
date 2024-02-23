import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/v2/audit/Base.js'
import audit from '../../../../connectors/v2/audit/index.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { newAccessRequestComment } from '../../../../services/v2/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'

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
      description: 'The updated access request.',
      content: {
        'application/json': {
          schema: z.object({
            accessRequest: accessRequestInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostRequestCommentResponse {
  accessRequest: AccessRequestInterface
}

export const postAccessRequestComment = [
  bodyParser.json(),
  async (req: Request, res: Response<PostRequestCommentResponse>) => {
    req.audit = AuditInfo.UpdateAccessRequest
    const {
      body,
      params: { accessRequestId },
    } = parse(req, postAccessRequestCommentSchema)

    const accessRequest = await newAccessRequestComment(req.user, accessRequestId, body.comment)

    await audit.onUpdateAccessRequest(req, accessRequest)

    return res.json({
      accessRequest,
    })
  },
]
