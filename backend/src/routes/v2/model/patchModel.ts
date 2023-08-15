import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'
import { parse } from '../../../utils/validate.js'

export const patchModelSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    visibility: z.nativeEnum(ModelVisibility).optional(),
  }),
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
})

interface PatchModelResponse {
  data: {
    model: ModelInterface
  }
}

export const patchModel = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchModelResponse>) => {
    const _ = parse(req, patchModelSchema)

    return res.json({
      data: {
        model: {
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
      },
    })
  },
]
