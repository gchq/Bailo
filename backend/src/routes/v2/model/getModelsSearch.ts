import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { EntryKind } from '../../../models/Model.js'
import { searchModels } from '../../../services/model.js'
import { registerPath } from '../../../services/specification.js'
import {
  EntrySearchOptionsParams,
  EntrySearchOptionsSchema,
  EntrySearchResultWithErrors,
} from '../../../types/types.js'
import { parse } from '../../../utils/validate.js'

export const getModelsSearchSchema = z.object({
  query: EntrySearchOptionsSchema,
})

registerPath({
  method: 'get',
  path: '/api/v2/models/search',
  tags: ['model'],
  description: 'Search through models',
  schema: getModelsSearchSchema,
  responses: {
    200: {
      description: 'Array with model summaries.',
      content: {
        'application/json': {
          schema: z.object({
            models: z.array(
              z.object({
                id: z.string().openapi({ example: 'yolo-abcdef' }),
                name: z.string().openapi({ example: 'Yolo v4' }),
                description: z.string().openapi({ example: 'You only look once' }),
                tags: z.array(z.string()).openapi({ example: ['tag', 'ml'] }),
                kind: z.string().openapi({ example: EntryKind.Model }),
                allowTemplating: z.boolean().openapi({ example: true }),
                schemaId: z.string().optional(),
                peerId: z.string().optional(),
              }),
            ),
            errors: z
              .record(
                z.string(),
                z.object({
                  peerId: z.string().optional(),
                  message: z.string().optional(),
                  code: z.number().optional(),
                }),
              )
              .optional(),
          }),
        },
      },
    },
  },
})

export const getModelsSearch = [
  async (req: Request, res: Response<EntrySearchResultWithErrors>): Promise<void> => {
    req.audit = AuditInfo.SearchModels
    const opts: { query: EntrySearchOptionsParams } = parse(req, getModelsSearchSchema)

    let results: EntrySearchResultWithErrors = {
      models: [],
    }

    results = await searchModels(req.user, opts.query)

    await audit.onSearchModel(req, results.models)

    res.json(results)
  },
]
