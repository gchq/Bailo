import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { renderToMarkdown } from '../../../../services/export.js'
import { modelExportSchema, registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const getExportedModelSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/export',
  tags: ['model'],
  description: 'Export a model to PDF',
  schema: getExportedModelSchema,
  responses: {
    200: {
      description: 'Model card instance.',
      content: {
        'application/json': {
          schema: z.object({
            exportedModel: modelExportSchema,
          }),
        },
      },
    },
  },
})

interface GetExportedModelResponse {
  exportedModel: string
}

export const getExportedModel = [
  bodyParser.json(),
  async (req: Request, res: Response<GetExportedModelResponse>) => {
    req.audit = AuditInfo.ViewModelCard
    const {
      params: { modelId },
    } = parse(req, getExportedModelSchema)

    const exportedModel = await renderToMarkdown(req.user, modelId)

    //await audit.onViewModelCard(req, modelId, modelCard)

    return res.json({ exportedModel })
  },
]
