import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ModelCardRevisionInterface } from '../../../../models/v2/ModelCardRevision.js'
import { createModelCardFromSchema } from '../../../../services/v2/model.js'
import { modelCardRevisionInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'

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

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/setup/from-schema',
  tags: ['modelcard'],
  description: 'Setup a blank model card for a model.',
  schema: postFromSchemaSchema,
  responses: {
    200: {
      description: 'Model card instance.',
      content: {
        'application/json': {
          schema: z.object({
            card: modelCardRevisionInterfaceSchema,
          }),
        },
      },
    },
  },
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
