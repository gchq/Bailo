import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AccessRequestInterface } from '../../../../models/v2/AccessRequest.js'
import { updateAccessRequest } from '../../../../services/v2/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/validate.js'
import { accessRequestMetadata } from './postAccessRequest.js'

export const patchAccessRequestSchema = z.object({
  body: z.object({
    metadata: accessRequestMetadata,
  }),
  params: z.object({
    accessRequestId: z.string(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}',
  tags: ['access-request'],
  description: 'Update an access request instance.',
  schema: patchAccessRequestSchema,
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

interface PatchAccessRequestResponse {
  accessRequest: AccessRequestInterface
}

export const patchAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchAccessRequestResponse>) => {
    const {
      body,
      params: { accessRequestId },
    } = parse(req, patchAccessRequestSchema)

    const accessRequest = await updateAccessRequest(req.user, accessRequestId, body)

    return res.json({
      accessRequest,
    })
  },
]
