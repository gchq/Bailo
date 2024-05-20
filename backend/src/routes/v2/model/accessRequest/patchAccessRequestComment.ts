import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { updateAccessRequestComment } from '../../../../services/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const patchAccessRequestCommentSchema = z.object({
  body: z.object({
    comment: z.string(),
  }),
  params: z.object({
    accessRequestId: z.string(),
    commentId: z.string(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}/comment/{commentId}',
  tags: ['access-request'],
  description: 'Update a comment on an access request.',
  schema: patchAccessRequestCommentSchema,
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

interface PatchRequestCommentResponse {
  accessRequest: AccessRequestInterface
}

export const patchAccessRequestComment = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchRequestCommentResponse>) => {
    req.audit = AuditInfo.UpdateAccessRequest
    const {
      body,
      params: { accessRequestId, commentId },
    } = parse(req, patchAccessRequestCommentSchema)

    const accessRequest = await updateAccessRequestComment(req.user, accessRequestId, commentId, body.comment)

    await audit.onUpdateAccessRequest(req, accessRequest)

    return res.json({
      accessRequest,
    })
  },
]
