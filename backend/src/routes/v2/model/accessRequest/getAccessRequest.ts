import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { ResponseInterface, ResponseKind } from '../../../../models/Response.js'
import { getAccessRequestById } from '../../../../services/accessRequest.js'
import { findResponsesById } from '../../../../services/response.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getAccessRequestSchema = z.object({
  params: z.object({
    accessRequestId: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}',
  tags: ['access-request'],
  description: 'Get an access request.',
  schema: getAccessRequestSchema,
  responses: {
    200: {
      description: 'An access request instance.',
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

interface GetAccessRequestResponse {
  accessRequest: AccessRequestInterface & { comments: ResponseInterface[] }
}

export const getAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<GetAccessRequestResponse>) => {
    req.audit = AuditInfo.ViewAccessRequest
    const { params } = parse(req, getAccessRequestSchema)

    const accessRequestWithCommentIds = await getAccessRequestById(req.user, params.accessRequestId)
    const comments = await findResponsesById(req.user, accessRequestWithCommentIds.commentIds)
    const accessRequest = { ...accessRequestWithCommentIds.toObject(), comments, kind: ResponseKind.Comment }

    await audit.onViewAccessRequest(req, accessRequestWithCommentIds)

    return res.json({
      accessRequest,
    })
  },
]
