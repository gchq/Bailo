import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { findSchemasByKind } from '../../../services/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/specification.js'
import { SchemaKind } from '../../../types/enums.js'
import { parse, strictCoerceBoolean } from '../../../utils/validate.js'

export const getSchemasSchema = z.object({
  query: z.object({
    kind: z.nativeEnum(SchemaKind).optional(),
    includeHidden: strictCoerceBoolean(z.boolean().optional().default(false)),
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
  async (req: Request, res: Response<GetSchemaResponse>) => {
    req.audit = AuditInfo.SearchSchemas
    const { query } = parse(req, getSchemasSchema)

    const schemas = await findSchemasByKind(query.kind, query.includeHidden)
    await audit.onSearchSchemas(req, schemas)

    return res.json({
      schemas,
    })
  },
]
