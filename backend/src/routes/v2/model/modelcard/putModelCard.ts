import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardRevisionInterface } from '../../../../models/v2/ModelCardRevision.js'
import { updateModelCard } from '../../../../services/v2/model.js'
import { parse } from '../../../../utils/validate.js'

const knownOverview = z.object({
  tags: z.array(z.string()).optional(),
})

const overview = z.intersection(knownOverview, z.record(z.unknown()))

const KnownMetadata = z
  .object({
    overview,
  })
  .optional()

export const modelCardMetadata = z.intersection(KnownMetadata, z.record(z.unknown()))

export const putModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    metadata: modelCardMetadata,
  }),
})

interface PutModelCardResponse {
  card: ModelCardRevisionInterface
}

export const putModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<PutModelCardResponse>) => {
    const {
      params: { modelId },
      body: { metadata },
    } = parse(req, putModelCardSchema)

    return res.json({
      card: await updateModelCard(req.user, modelId, metadata),
    })
  },
]
