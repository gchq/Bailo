import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardInterface } from '../../../../models/v2/Model.js'
import { getModelById, getModelCardRevision } from '../../../../services/v2/model.js'
import { NotFound } from '../../../../utils/v2/error.js'
import { parse } from '../../../../utils/validate.js'

export const GetModelCardVersionOptions = {
  Latest: 'latest',
} as const

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

    let modelCard: ModelCardInterface
    if (version === GetModelCardVersionOptions.Latest) {
      const card = (await getModelById(req.user, modelId)).card

      console.log('CARD', card)

      if (!card) {
        throw NotFound('This model has no model card setup', { modelId, version })
      }

      modelCard = card
    } else {
      modelCard = await getModelCardRevision(req.user, modelId, version)
    }

    return res.json({ modelCard })
  },
]
