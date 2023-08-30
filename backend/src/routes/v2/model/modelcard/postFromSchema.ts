import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardRevisionInterface } from '../../../../models/v2/ModelCardRevision.js'
import { createModelCardFromSchema } from '../../../../services/v2/model.js'
import { parse } from '../../../../utils/validate.js'

export const postFromSchemaSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    schemaId: z.string({
      required_error: 'Must specify schema id within the body',
    }),
  }),
})

interface PostFromSchemaResponse {
  card: ModelCardRevisionInterface
}

export const postFromSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<PostFromSchemaResponse>) => {
    const {
      params: { modelId },
      body: { schemaId },
    } = parse(req, postFromSchemaSchema)

    return res.json({
      card: await createModelCardFromSchema(req.user, modelId, schemaId),
    })
  },
]
