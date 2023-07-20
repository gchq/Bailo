import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { ModelCardInterface } from '../../../models/v2/ModelCard.js'

interface GetModelCardResponse {
  data: {
    modelCard: ModelCardInterface
  }
}

export const getModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCardResponse>) => {
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
