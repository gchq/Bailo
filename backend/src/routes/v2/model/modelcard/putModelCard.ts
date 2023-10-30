import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardRevisionInterface } from '../../../../models/v2/ModelCardRevision.js'
import { updateModelCard } from '../../../../services/v2/model.js'
import { modelCardRevisionInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/validate.js'

export const putModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    metadata: z.unknown(),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/model/{modelId}/model-cards',
  tags: ['modelcard'],
  description: 'Update the model card for a model.',
  schema: putModelCardSchema,
  responses: {
    200: {
      description: 'A model card revision instance.',
      content: {
        'application/json': {
          schema: z.object({
            card: modelCardRevisionInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PutModelCardResponse {
  card: ModelCardRevisionInterface
}

export const putModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<PutModelCardResponse>) => {
    const {
      params: { modelId },
      body: { metadata },
    } = parse(req, putModelCardSchema)

    return res.json({
      card: await updateModelCard(req.user, modelId, metadata),
    })
  },
]
