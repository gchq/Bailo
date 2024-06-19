import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { renderToHtml } from '../../../../services/export.js'
import { registerPath } from '../../../../services/specification.js'
import { GetModelCardVersionOptions } from '../../../../types/enums.js'
import { parse } from '../../../../utils/validate.js'

export const getModelCardHtmlSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
    version: z.nativeEnum(GetModelCardVersionOptions).or(z.coerce.number()),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/model-card/{version}/html',
  tags: ['modelcard'],
  description: 'Get a specific version of a model card as HTML.',
  schema: getModelCardHtmlSchema,
  responses: {
    200: {
      description: 'Model card instance.',
      content: {
        'application/html': {
          schema: {
            type: 'string',
          },
        },
      },
    },
  },
})

export const getModelCardHtml = [
  bodyParser.json(),
  async (req: Request, res: Response) => {
    req.audit = AuditInfo.ViewModelCard
    const {
      params: { modelId, version },
    } = parse(req, getModelCardHtmlSchema)

    const { html, card } = await renderToHtml(req.user, modelId, version)
    await audit.onViewModelCard(req, modelId, card)

    return res.send(html)
  },
]
