import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/v2/audit/Base.js'
import audit from '../../../../connectors/v2/audit/index.js'
import { AccessRequestInterface } from '../../../../models/v2/AccessRequest.js'
import { updateAccessRequestComments } from '../../../../services/v2/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'

export const createAccessRequestCommentSchema = z.object({
  body: z.object({
    comment: z.string(),
  }),
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}/comment',
  tags: ['access-request'],
  description: 'Add a comment to an access request.',
  schema: createAccessRequestCommentSchema,
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

interface CreateAccessRequestCommentResponse {
  accessRequest: AccessRequestInterface
}

export const createAccessRequestComment = [
  bodyParser.json(),
  async (req: Request, res: Response<CreateAccessRequestCommentResponse>) => {
    req.audit = AuditInfo.UpdateAccessRequest
    const {
      body,
      params: { accessRequestId },
    } = parse(req, createAccessRequestCommentSchema)

    const accessRequest = await updateAccessRequestComments(req.user, accessRequestId, body.comment)

    await audit.onUpdateAccessRequest(req, accessRequest)

    return res.json({
      accessRequest,
    })
  },
]
