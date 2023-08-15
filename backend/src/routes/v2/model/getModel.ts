import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelInterface } from '../../../models/v2/Model.js'
import { getModelById } from '../../../services/v2/model.js'
import { parse } from '../../../utils/validate.js'

export const getModelSchema = z.object({
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
    const { params } = parse(req, getModelSchema)

    const model = await getModelById(req.user, params.modelId)

    return res.json({
      data: {
        model,
      },
    })
  },
]
