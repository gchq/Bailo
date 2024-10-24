import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { removeAccessRequest } from '../../../../services/accessRequest.js'
import { removeAccessRequestReview } from '../../../../services/review.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const deleteAccessRequestSchema = z.object({
  params: z.object({
    modelId: z.string(),
    accessRequestId: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}',
  tags: ['access-request'],
  description: 'Delete an access request.',
  schema: deleteAccessRequestSchema,
  responses: {
    200: {
      description: 'A message confirming the removal of the access request.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed access request' }),
          }),
        },
      },
    },
  },
})

interface DeleteAccessRequestResponse {
  message: string
}

export const deleteAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteAccessRequestResponse>) => {
    req.audit = AuditInfo.DeleteAccessRequest
    const {
      params: { accessRequestId },
    } = parse(req, deleteAccessRequestSchema)

    await removeAccessRequest(req.user, accessRequestId)
    await removeAccessRequestReview(accessRequestId)

    await audit.onDeleteAccessRequest(req, accessRequestId)

    return res.json({
      message: 'Successfully removed access request.',
    })
  },
]
