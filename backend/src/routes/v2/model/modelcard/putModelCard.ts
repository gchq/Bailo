import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { ModelCardRevisionInterface } from '../../../../models/ModelCardRevision.js'
import { updateModelCard } from '../../../../services/model.js'
import { modelCardRevisionInterfaceSchema, registerPath } from '../../../../services/specification.js'
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

registerPath({
  method: 'put',
  path: '/api/v2/model/{modelId}/model-cards',
  tags: ['modelcard'],
  description: 'Update the model card for a model.',
  schema: putModelCardSchema,
  responses: {
    200: {
      description: 'A model card revision instance.',
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

interface PutModelCardResponse {
  card: ModelCardRevisionInterface
}

export const putModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<PutModelCardResponse>): Promise<void> => {
    req.audit = AuditInfo.UpdateModelCard
    const {
      params: { modelId },
      body: { metadata },
    } = parse(req, putModelCardSchema)

    const modelCard = await updateModelCard(req.user, modelId, metadata)

    await audit.onUpdateModelCard(req, modelId, modelCard.toObject())

    res.json({
      card: modelCard,
    })
  },
]
