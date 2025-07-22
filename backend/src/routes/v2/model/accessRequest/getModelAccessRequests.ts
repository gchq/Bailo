import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { getAccessRequestsByModel } from '../../../../services/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getModelAccessRequestsSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/access-requests',
  tags: ['access-request'],
  description: 'Get all access requests for a model.',
  schema: getModelAccessRequestsSchema,
  responses: {
    200: {
      description: 'An array of access request instances.',
      content: {
        'application/json': {
          schema: z.object({
            accessRequests: z.array(accessRequestInterfaceSchema),
          }),
        },
      },
    },
  },
})

interface GetModelAccessRequestsResponse {
  accessRequests: Array<AccessRequestInterface>
}

export const getModelAccessRequests = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelAccessRequestsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewAccessRequests
    const {
      params: { modelId },
    } = parse(req, getModelAccessRequestsSchema)

    const accessRequests = await getAccessRequestsByModel(req.user, modelId)

    await audit.onViewAccessRequests(req, accessRequests)

    res.json({ accessRequests })
  },
]
