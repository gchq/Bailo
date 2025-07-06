import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { ModelCardRevisionInterface } from '../../../../models/ModelCardRevision.js'
import { createModelCardFromTemplate, getModelById } from '../../../../services/model.js'
import { modelCardRevisionInterfaceSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postFromTemplateSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    templateId: z.string({
      required_error: 'Must specify template id within the body',
    }),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/setup/from-template',
  tags: ['modelcard'],
  description: 'Setup a model card using a template.',
  schema: postFromTemplateSchema,
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

interface PostFromTemplateResponse {
  card: ModelCardRevisionInterface
}

export const postFromTemplate = [
  bodyParser.json(),
  async (req: Request, res: Response<PostFromTemplateResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateModelCard
    const {
      params: { modelId },
      body: { templateId },
    } = parse(req, postFromTemplateSchema)

    const modelCard = await createModelCardFromTemplate(req.user, modelId, templateId)
    const model = await getModelById(req.user, modelId)

    await audit.onCreateModelCard(req, model, modelCard)

    res.json({
      card: modelCard,
    })
  },
]
