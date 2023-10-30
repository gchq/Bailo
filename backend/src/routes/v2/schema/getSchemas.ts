import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { SchemaInterface } from '../../../models/v2/Schema.js'
import { findSchemasByKind } from '../../../services/v2/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/v2/specification.js'
import { SchemaKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const getSchemasSchema = z.object({
  query: z.object({
    kind: z.nativeEnum(SchemaKind).optional(),
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
    const { query } = parse(req, getSchemasSchema)

    const schemas = await findSchemasByKind(query.kind)

    return res.json({
      schemas,
    })
  },
]
