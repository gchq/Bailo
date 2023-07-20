import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'

interface PatchModelResponse {
  data: {
    model: ModelInterface
  }
}

export const patchModel = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchModelResponse>) => {

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