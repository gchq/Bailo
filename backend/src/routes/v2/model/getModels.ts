import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'

export const GetModelFilters = {
  Mine: 'mine',
} as const

export type GetModelFiltersKeys = (typeof GetModelFilters)[keyof typeof GetModelFilters]

export const getModelsSchema = z.object({
  query: z.object({
    // These are all optional with defaults.  If they are not provided, they do not filter settings.
    task: z.string().optional(),

    libraries: z.array(z.string()).optional().default([]),
    filters: z.array(z.nativeEnum(GetModelFilters)).optional().default([]),
    search: z.string().optional().default(''),
  }),
})

interface GetModelsResponse {
  data: {
    models: Array<ModelInterface>
  }
}

export const getModels = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelsResponse>) => {
    const _ = parse(req, getModelsSchema)

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
