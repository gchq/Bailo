import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { getAccessRequestById } from '../../../../services/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getAccessRequestSchema = z.object({
  params: z.object({
    modelId: z.string(),
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
  accessRequest: AccessRequestInterface
}

export const getAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<GetAccessRequestResponse>) => {
    req.audit = AuditInfo.ViewAccessRequest
    const { params } = parse(req, getAccessRequestSchema)

    const accessRequest = await getAccessRequestById(req.user, params.accessRequestId)

    await audit.onViewAccessRequest(req, accessRequest)

    return res.json({
      accessRequest,
    })
  },
]
