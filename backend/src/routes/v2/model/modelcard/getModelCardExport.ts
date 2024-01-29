import bodyParser from 'body-parser'
import contentDisposition from 'content-disposition'
import { Request, Response } from 'express'
import { z } from 'zod'

import { getModelCardExport as getModelCardExportService } from '../../../../services/v2/model.js'
import { registerPath } from '../../../../services/v2/specification.js'
import { GetModelCardVersionOptions } from '../../../../types/v2/enums.js'
import { parse } from '../../../../utils/v2/validate.js'

export const getModelCardExportSchema = z.object({
  params: z.object({
    modelId: z.string(),
    version: z.nativeEnum(GetModelCardVersionOptions).or(z.coerce.number()),
  }),
  query: z.object({
    disableBackground: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
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

export const getModelCardExport = [
  bodyParser.json(),
  async (req: Request, res: Response) => {
    const {
      params: { modelId, version },
      query: { disableBackground },
    } = parse(req, getModelCardExportSchema)

    const { doc, fileName } = await getModelCardExportService(req.user, modelId, version, disableBackground)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', contentDisposition(fileName, { type: 'attachment' }))
    doc.pipe(res)
  },
]
