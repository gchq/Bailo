import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { ModelInterface, ModelVisibility } from '../../../models/v2/Model.js'

export const postModelSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Must specify model name',
    }),
    description: z.string({
      required_error: 'Must specify model description',
    }),
    visibility: z.nativeEnum(ModelVisibility).optional().default(ModelVisibility.Public),
  }),
})

interface PostModelResponse {
  data: {
    model: ModelInterface
  }
}

export const postModel = [
  bodyParser.json(),
  async (req: Request, res: Response<PostModelResponse>) => {
    const _ = parse(req, postModelSchema)

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
