import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardInterface } from '../../../../models/v2/ModelCard.js'
import { parse } from '../../../../utils/validate.js'

export const patchModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    metadata: z.unknown(),
  }),
})

interface patchModelCardResponse {
  modelCard: ModelCardInterface
}

export const patchModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<patchModelCardResponse>) => {
    const _ = parse(req, patchModelCardSchema)

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
