import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { EntryKind, EntryKindKeys } from '../../../models/Model.js'
import { searchModels } from '../../../services/model.js'
import { registerPath } from '../../../services/specification.js'
import { ModelSearchResultWithErrors } from '../../../types/types.js'
import { coerceArray, parse, strictCoerceBoolean } from '../../../utils/validate.js'

export const getModelsSearchSchema = z.object({
  query: z.object({
    // These are all optional with defaults.  If they are not provided, they do not filter settings.
    kind: z.string(z.nativeEnum(EntryKind)).optional(),
    task: z.string().optional(),
    libraries: coerceArray(z.array(z.string()).optional().default([])),
    organisations: coerceArray(z.array(z.string()).optional().default([])),
    states: coerceArray(z.array(z.string()).optional().default([])),
    filters: coerceArray(z.array(z.string()).optional().default([])),
    search: z
      .string()
      .optional()
      .openapi({
        example: `Text to filter by - must be longer than 0 characters to be considered, and longer than 3 characters to be used for searching this local instance.
        External repos may have their own minimum length`,
      })
      .default(''),
    allowTemplating: strictCoerceBoolean(z.boolean().optional()),
    schemaId: z.string().optional(),
    peers: coerceArray(z.array(z.string()).optional().default([])),
  }),
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
  async (req: Request, res: Response<ModelSearchResultWithErrors>): Promise<void> => {
    req.audit = AuditInfo.SearchModels
    const {
      query: { kind, libraries, filters, search, task, allowTemplating, schemaId, organisations, states, peers },
    } = parse(req, getModelsSearchSchema)

    let results: ModelSearchResultWithErrors = {
      models: [],
    }

    results = await searchModels(
      req.user,
      kind as EntryKindKeys,
      libraries,
      organisations,
      states,
      filters,
      search,
      task,
      peers,
      allowTemplating,
      schemaId,
    )

    await audit.onSearchModel(req, results.models)

    res.json(results)
  },
]
