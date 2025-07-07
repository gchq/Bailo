import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { searchSchemas } from '../../../services/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/specification.js'
import { SchemaKind } from '../../../types/enums.js'
import { parse, strictCoerceBoolean } from '../../../utils/validate.js'

export const getSchemasSchema = z.object({
  query: z.object({
    kind: z.nativeEnum(SchemaKind).optional(),
    hidden: strictCoerceBoolean(z.boolean().optional()),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/schemas',
  tags: ['schema'],
  description: 'Get a list of schemas on this Bailo instance.',
  schema: getSchemasSchema,
  responses: {
    200: {
      description: 'An array of schema instances.',
      content: {
        'application/json': {
          schema: z.object({
            schemas: z.array(schemaInterfaceSchema),
          }),
        },
      },
    },
  },
})

interface GetSchemaResponse {
  schemas: Array<SchemaInterface>
}

export const getSchemas = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaResponse>): Promise<void> => {
    req.audit = AuditInfo.SearchSchemas
    const { query } = parse(req, getSchemasSchema)

    const schemas = await searchSchemas(query.kind, query.hidden)
    await audit.onSearchSchemas(req, schemas)

    res.json({
      schemas,
    })
  },
]
