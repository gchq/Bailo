import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'
import { parse } from '../../../utils/validate.js'

export const GetModelFilters = {
  Mine: 'mine',
  Favourites: 'favourites',
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

            collaborators: [
              {
                entity: 'user:user',
                roles: ['admin'],
              },
            ],

            visibility: ModelVisibility.Public,
            deleted: false,

            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'example-model-2',

            name: 'Example Model 2',
            description: 'An example Bailo model 2',

            collaborators: [
              {
                entity: 'user:user',
                roles: ['admin'],
              },
            ],

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
