import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { AccessRequestInterface } from '../../../../models/AccessRequest.js'
import { getAccessRequestGroup as findGroup } from '../../../../services/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getAccessRequestGroupSchema = z.object({
  params: z.object({ modelId: z.string(), accessRequestId: z.string() }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}/group',
  tags: ['access-request'],
  description:
    'List visible access requests created in the same group. Each model and request has its own visibility checks.',
  schema: getAccessRequestGroupSchema,
  responses: {
    200: {
      description: 'Visible requests in the group, or an empty list for an ungrouped request.',
      content: { 'application/json': { schema: z.object({ accessRequests: z.array(accessRequestInterfaceSchema) }) } },
    },
  },
})

export const getAccessRequestGroup = [
  async (req: Request, res: Response<{ accessRequests: AccessRequestInterface[] }>): Promise<void> => {
    req.audit = AuditInfo.ViewAccessRequests
    const {
      params: { modelId, accessRequestId },
    } = parse(req, getAccessRequestGroupSchema)
    const accessRequests = await findGroup(req.user, modelId, accessRequestId)
    await audit.onViewAccessRequests(req, accessRequests)
    res.json({ accessRequests })
  },
]
