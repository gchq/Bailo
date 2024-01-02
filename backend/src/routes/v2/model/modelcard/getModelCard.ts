import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/v2/audit/Base.js'
import audit from '../../../../connectors/v2/audit/index.js'
import { ModelCardInterface } from '../../../../models/v2/Model.js'
import { getModelCard as getModelCardService } from '../../../../services/v2/model.js'
import { modelCardInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { GetModelCardVersionOptions } from '../../../../types/v2/enums.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getModelCardSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
    version: z.nativeEnum(GetModelCardVersionOptions).or(z.coerce.number()),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/model-card/{version}',
  tags: ['modelcard'],
  description: 'Get a specific version of a model card.',
  schema: getModelCardSchema,
  responses: {
    200: {
      description: 'Model card instance.',
      content: {
        'application/json': {
          schema: z.object({
            modelCard: modelCardInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface GetModelCardResponse {
  modelCard: ModelCardInterface
}

export const getModelCard = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCardResponse>) => {
    req.audit = AuditInfo.ViewModelCard
    const {
      params: { modelId, version },
    } = parse(req, getModelCardSchema)

    const modelCard = await getModelCardService(req.user, modelId, version)

    await audit.onViewModelCard(req, modelId, modelCard)

    return res.json({ modelCard })
  },
]
