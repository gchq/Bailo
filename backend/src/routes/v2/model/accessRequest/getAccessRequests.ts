import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { findAccessRequest } from '../../../../services/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse, strictCoerceBoolean } from '../../../../utils/validate.js'

export const GetAccessRequestsSchema = z.object({
  query: z.object({
    adminAccess: strictCoerceBoolean(z.boolean().optional().default(false)),
  }),
})

registerPath({
  method: 'get',
  // TODO: diagnose why simplifying to /api/v2/model/access-requests breaks it?
  path: '/api/v2/model/access-requests/testing',
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
      query: { adminAccess },
    } = parse(req, GetAccessRequestsSchema)

    const accessRequests = await findAccessRequest(req.user, adminAccess)

    await audit.onViewAccessRequests(req, accessRequests)

    res.json({ accessRequests })
  },
]
