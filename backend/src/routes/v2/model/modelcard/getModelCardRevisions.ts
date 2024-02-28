import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { ModelCardInterface } from '../../../../models/Model.js'
import { getModelCardRevisions as getModelCardRevisionsService } from '../../../../services/model.js'
import { modelCardInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getModelCardRevisionsSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/model-card-revisions',
  tags: ['modelcard'],
  description: 'Get a specific version of a model card.',
  schema: getModelCardRevisionsSchema,
  responses: {
    200: {
      description: 'An array of model card instances.',
      content: {
        'application/json': {
          schema: z.object({
            modelCardRevisions: z.array(modelCardInterfaceSchema),
          }),
        },
      },
    },
  },
})

interface GetModelCardResponse {
  modelCardRevisions: Array<ModelCardInterface>
}

export const getModelCardRevisions = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCardResponse>) => {
    req.audit = AuditInfo.ViewModelCardRevisions
    const {
      params: { modelId },
    } = parse(req, getModelCardRevisionsSchema)

    const modelCardRevisions = await getModelCardRevisionsService(req.user, modelId)

    await audit.onViewModelCardRevisions(req, modelId, modelCardRevisions)

    return res.json({ modelCardRevisions })
  },
]
