import bodyParser from 'body-parser'
import contentDisposition from 'content-disposition'
import { Request, Response } from 'express'
import { z } from 'zod'

import { FileInterface } from '../../../../models/v2/File.js'
import { getModelCardExport as getModelCardExportService } from '../../../../services/v2/model.js'
import { registerPath } from '../../../../services/v2/specification.js'
import { GetModelCardVersionOptions } from '../../../../types/v2/enums.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getModelCardExportSchema = z.object({
  params: z.object({
    modelId: z.string(),
    version: z.nativeEnum(GetModelCardVersionOptions).or(z.coerce.number()),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/model-card/{version}/export',
  tags: ['modelcard'],
  description: 'Get a specific version of a model card as a PDF.',
  schema: getModelCardExportSchema,
  responses: {
    200: {
      description: 'Model card instance as a PDF.',
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  },
})

interface GetModelCardExportResponse {
  file: FileInterface
}

export const getModelCardExport = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelCardExportResponse>) => {
    const {
      params: { modelId, version },
    } = parse(req, getModelCardExportSchema)

    const doc = await getModelCardExportService(req.user, modelId, version)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', contentDisposition('modelCard.pdf', { type: 'attachment' }))
    doc.pipe(res)
  },
]
