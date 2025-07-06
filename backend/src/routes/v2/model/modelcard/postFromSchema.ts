import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { ModelCardRevisionInterface } from '../../../../models/ModelCardRevision.js'
import { createModelCardFromSchema, getModelById } from '../../../../services/model.js'
import { modelCardRevisionInterfaceSchema, registerPath } from '../../../../services/specification.js'
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
  async (req: Request, res: Response<PostFromSchemaResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateModelCard
    const {
      params: { modelId },
      body: { schemaId },
    } = parse(req, postFromSchemaSchema)

    const modelCard = await createModelCardFromSchema(req.user, modelId, schemaId)
    const model = await getModelById(req.user, modelId)

    await audit.onCreateModelCard(req, model, modelCard)

    res.json({
      card: modelCard,
    })
  },
]
