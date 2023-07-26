import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'

export const getModelFilesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetModelResponse {
  data: {
    model: ModelInterface
  }
}

export const getModel = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelResponse>) => {
    const _ = parse(req, getModelFilesSchema)

    return res.json({
      data: {
        model: {
          id: 'example-model-2',

          name: 'Example Model 2',
          description: 'An example Bailo model 2',

          visibility: ModelVisibility.Public,
          deleted: false,

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    })
  },
]
