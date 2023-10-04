import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardInterface } from '../../../../models/v2/Model.js'
import { getModelCardRevisions as getModelCardRevisionsService } from '../../../../services/v2/model.js'
import { parse } from '../../../../utils/validate.js'

export const getModelCardRevisionsSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

interface GetModelCardResponse {
  modelCardRevisions: Array<ModelCardInterface>
}

export const getModelCardRevisions = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCardResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getModelCardRevisionsSchema)

    const modelCardRevisions = await getModelCardRevisionsService(req.user, modelId)

    return res.json({ modelCardRevisions })
  },
]
