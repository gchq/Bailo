import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardInterface } from '../../../../models/v2/ModelCard.js'
import { ModelCardRevisionDoc } from '../../../../models/v2/ModelCardRevision.js'
import { getModelCardLatestRevision, getModelCardRevision } from '../../../../services/v2/modelCard.js'
import { parse } from '../../../../utils/validate.js'

export const GetModelCardVersionOptions = {
  Latest: 'latest',
} as const

export const getModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
    version: z.nativeEnum(GetModelCardVersionOptions).or(z.number()),
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

    let modelCard: ModelCardRevisionDoc
    if (version === GetModelCardVersionOptions.Latest) {
      modelCard = await getModelCardLatestRevision(req.user, modelId)
    } else {
      modelCard = await getModelCardRevision(req.user, modelId, version)
    }

    return res.json({ modelCard })
  },
]
