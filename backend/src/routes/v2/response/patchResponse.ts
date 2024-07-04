import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ResponseInterface } from '../../../models/Response.js'
import { updateResponse } from '../../../services/response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const patchResponseSchema = z.object({
  params: z.object({
    responseId: z.string(),
  }),
  body: z.object({
    comment: z.string(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/response/{responseId}',
  tags: ['response'],
  description: 'Update either a comment or a review response',
  schema: patchResponseSchema,
  responses: {
    200: {
      description: 'A response instance.',
      content: {
        'application/json': {
          schema: z.object({
            review: responseInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PatchResponseResponse {
  response: ResponseInterface
}

export const patchResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchResponseResponse>) => {
    req.audit = AuditInfo.UpdateResponse
    const {
      params: { responseId },
      body: { ...body },
    } = parse(req, patchResponseSchema)

    const response = await updateResponse(req.user, responseId, body.comment)

    await audit.onUpdateResponse(req, responseId)

    return res.json({
      response,
    })
  },
]
