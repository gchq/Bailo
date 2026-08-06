import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import { z } from '../../../../lib/zod.js'
import { extractModelCardFromText } from '../../../../services/modelCardImport.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const postImportModelCardTextSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as param',
    }),
  }),
  body: z.object({
    text: z.string({
      required_error: 'Must provide model card text to import',
    }),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/import-model-card-text',
  tags: ['modelcard'],
  description: 'Extract model card metadata from free text using an LLM.',
  schema: postImportModelCardTextSchema,
  responses: {
    200: {
      description: 'Extracted model card metadata matching the schema structure.',
      content: {
        'application/json': {
          schema: z.object({
            metadata: z.record(z.string(), z.unknown()).openapi({
              example: { overview: { name: 'My Model', description: 'A machine learning model.' } },
            }),
            warnings: z.array(z.string()).openapi({
              example: ['instance.overview.version is not of a type(s) string'],
            }),
          }),
        },
      },
    },
  },
})

interface PostImportModelCardTextResponse {
  metadata: Record<string, unknown>
  warnings: string[]
}

export const postImportModelCardText = [
  async (req: Request, res: Response<PostImportModelCardTextResponse>): Promise<void> => {
    req.audit = AuditInfo.ImportModelCardText
    const {
      params: { modelId },
      body: { text },
    } = parse(req, postImportModelCardTextSchema)

    const { metadata, warnings } = await extractModelCardFromText(req.user, modelId, text)

    res.json({ metadata, warnings })
  },
]
