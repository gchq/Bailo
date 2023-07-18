import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { ModelInterface, ModelVisibility } from '../../../models/v2/ModelModel.js'
import { createModel } from '../../../services/v2/model.js'

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
    const { body } = parse(req, postModelSchema)

    const model = await createModel(req.user, body)

    return res.json({
      data: {
        model,
      },
    })
  },
]
