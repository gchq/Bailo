import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReactionKind, ResponseInterface } from '../../../models/Response.js'
import { updateResponseReaction } from '../../../services/response.js'
import { registerPath, responseInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const patchResponseReactionSchema = z.object({
  params: z.object({
    responseId: z.string(),
    kind: z.nativeEnum(ReactionKind),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/response/{responseId}/reaction/{kind}',
  tags: ['response'],
  description: `Update a response's reactions`,
  schema: patchResponseReactionSchema,
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

interface PatchResponseReactionResponse {
  response: ResponseInterface
}

export const patchResponseReaction = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchResponseReactionResponse>) => {
    const {
      params: { responseId, kind },
    } = parse(req, patchResponseReactionSchema)

    const response = await updateResponseReaction(req.user, responseId, kind)

    return res.json({
      response,
    })
  },
]
