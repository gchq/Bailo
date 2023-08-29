import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardInterface } from '../../../../models/v2/ModelCard.js'
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

interface PutModelCardResponse {
  modelCard: ModelCardInterface
}

export const putModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<PutModelCardResponse>) => {
    const _ = parse(req, putModelCardSchema)

    return res.json({
      modelCard: {
        modelId: 'example-model',
        schemaId: 'example-schema',

        version: 1,
        metadata: { example: true },

        createdBy: 'Example User (user)',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  },
]
