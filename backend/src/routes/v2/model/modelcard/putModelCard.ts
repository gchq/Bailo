import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardRevisionInterface } from '../../../../models/v2/ModelCardRevision.js'
import { updateModelCard } from '../../../../services/v2/model.js'
import { parse } from '../../../../utils/validate.js'

export const putModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    metadata: z.unknown(),
  }),
})

interface PutModelCardResponse {
  card: ModelCardRevisionInterface
}

export const putModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<PutModelCardResponse>) => {
    console.log(req)
    const {
      params: { modelId },
      body: { metadata },
    } = parse(req, putModelCardSchema)

    return res.json({
      card: await updateModelCard(req.user, modelId, metadata),
    })
  },
]
