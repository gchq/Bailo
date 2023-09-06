import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardInterface } from '../../../../models/v2/Model.js'
import { getModelCard as getModelCardService } from '../../../../services/v2/model.js'
import { GetModelCardVersionOptions } from '../../../../types/v2/enums.js'
import { parse } from '../../../../utils/validate.js'

export const getModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
    version: z.nativeEnum(GetModelCardVersionOptions).or(z.coerce.number()),
  }),
})

interface GetModelCardResponse {
  modelCard: ModelCardInterface
}

export const getModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCardResponse>) => {
    const {
      params: { modelId, version },
    } = parse(req, getModelCardSchema)

    const modelCard = await getModelCardService(req.user, modelId, version)

    return res.json({ modelCard })
  },
]
