import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { ResponseInterface } from '../../../models/Response.js'
import { getResponsesByParentIds, getResponsesByUser } from '../../../services/response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { coerceArray, parse, strictCoerceBoolean } from '../../../utils/validate.js'

export const getResponseSchema = z.object({
  query: z
    .object({
      parentIds: coerceArray(z.array(z.string())),
    })
    .or(
      z.object({
        mine: strictCoerceBoolean(z.boolean()),
      }),
    ),
})

registerPath({
  method: 'get',
  path: '/api/v2/responses',
  tags: ['response'],
  description: 'Get a list of responses with matching parent IDs.',
  schema: z.object({
    query: z.object({
      parentIds: z.array(z.string()).optional(),
      mine: z.boolean().optional(),
    }),
  }),
  responses: {
    200: {
      description: 'An array of responses.',
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
  async (req: Request, res: Response<getResponsesResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewResponses
    const { query } = parse(req, getResponseSchema)

    let responses: ResponseInterface[]
    if ('mine' in query) {
      responses = await getResponsesByUser(req.user)
    } else {
      responses = await getResponsesByParentIds(query.parentIds)
    }
    await audit.onViewResponses(req, responses)

    res.json({
      responses,
    })
  },
]
