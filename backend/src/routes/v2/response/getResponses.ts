import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { ResponseInterface } from '../../../models/Response.js'
import { getResponsesByParentIds } from '../../../services/response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { coerceArray, parse } from '../../../utils/validate.js'

export const getResponseSchema = z.object({
  query: z.object({
    parentIds: coerceArray(z.array(z.string())),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/responses',
  tags: ['response'],
  description: 'Get a list of responses with matching parent IDs',
  schema: getResponseSchema,
  responses: {
    200: {
      description: 'An array of responsess.',
      content: {
        'application/json': {
          schema: z.array(
            z.object({
              response: responseInterfaceSchema,
            }),
          ),
        },
      },
    },
  },
})

interface getResponsesResponse {
  responses: ResponseInterface[]
}

export const getResponses = [
  bodyParser.json(),
  async (req: Request, res: Response<getResponsesResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewResponses
    const {
      query: { parentIds },
    } = parse(req, getResponseSchema)

    const responses = await getResponsesByParentIds(req.user, parentIds)
    await audit.onViewResponses(req, responses)

    res.json({
      responses,
    })
  },
]
