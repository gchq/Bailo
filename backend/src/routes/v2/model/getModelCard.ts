import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardInterface } from '../../../models/v2/ModelCard.js'
import { parse } from '../../../utils/validate.js'

export const GetModelCardVersionOptions = {
  Latest: 'latest',
} as const

export const getModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
    version: z.nativeEnum(GetModelCardVersionOptions).or(z.number()),
  }),
})

interface GetModelCardResponse {
  data: {
    modelCard: ModelCardInterface
  }
}

export const getModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCardResponse>) => {
    const _ = parse(req, getModelCardSchema)

    return res.json({
      data: {
        modelCard: {
          modelId: 'example-model',
          schemaId: 'example-schema',

          version: 1,
          metadata: { example: true },

          createdBy: 'Example User (user)',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    })
  },
]
