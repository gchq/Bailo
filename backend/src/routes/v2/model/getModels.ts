import bodyParser from 'body-parser'
import { Request, Response } from 'express'

import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'

export const GetModelFilters = {
  Mine: 'mine',
} as const

export type GetModelFiltersKeys = (typeof GetModelFilters)[keyof typeof GetModelFilters]

interface GetModelsResponse {
  data: {
    models: Array<ModelInterface>
  }
}

export const getModels = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelsResponse>) => {

    return res.json({
      data: {
        models: [
          {
            id: 'example-model',

            name: 'Example Model',
            description: 'An example Bailo model',

            visibility: ModelVisibility.Public,
            deleted: false,

            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'example-model-2',

            name: 'Example Model 2',
            description: 'An example Bailo model 2',

            visibility: ModelVisibility.Public,
            deleted: false,

            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    })
  },
]