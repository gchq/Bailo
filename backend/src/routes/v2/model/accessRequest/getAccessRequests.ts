import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { findAccessRequests } from '../../../../services/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { coerceArray, parse, strictCoerceBoolean } from '../../../../utils/validate.js'

export const GetAccessRequestsSchema = z.object({
  query: z.object({
    modelId: coerceArray(z.array(z.string()).optional().default([])),
    schemaId: z.string().optional().default(''),
    mine: strictCoerceBoolean(z.boolean().optional().default(false)),
    adminAccess: strictCoerceBoolean(z.boolean().optional().default(false)),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/access-requests/search',
  tags: ['access-request'],
  description: 'Get all access requests for all models.',
  schema: GetAccessRequestsSchema,
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

interface GetAccessRequestsResponse {
  accessRequests: Array<AccessRequestInterface>
}

export const getAccessRequests = [
  async (req: Request, res: Response<GetAccessRequestsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewAccessRequests
    const {
      query: { modelId, schemaId, mine, adminAccess },
    } = parse(req, GetAccessRequestsSchema)

    const accessRequests = await findAccessRequests(req.user, modelId, schemaId, mine, adminAccess)

    await audit.onViewAccessRequests(req, accessRequests)

    res.json({ accessRequests })
  },
]
