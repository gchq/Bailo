import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { createSchema } from '../../../services/v2/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/v2/specification.js'
import { SchemaKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const putSchemaSchema = z.object({
  body: z.object({
    id: z.string({
      required_error: 'Must specify schema ID',
    }),
    name: z.string({
      required_error: 'Must specify schema name',
    }),
    description: z.string({
      required_error: 'Must specify schema description',
    }),
    kind: z.nativeEnum(SchemaKind, {
      required_error: 'Must specify schema kind',
    }),
    active: z.boolean({
      required_error: 'Must specify is schema is active or not',
    }),
    jsonSchema: z.object({}).passthrough(),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/schema/{schemaId}',
  tags: ['schema'],
  description: 'Update an existing schema.',
  schema: putSchemaSchema,
  responses: {
    200: {
      description: 'The updated schema instance.',
      content: {
        'application/json': {
          schema: z.object({
            schema: schemaInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PutSchemaResponse {
  schema: SchemaInterface
}

export const putSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<PutSchemaResponse>) => {
    req.audit = AuditInfo.CreateSchema
    const { body } = parse(req, putSchemaSchema)

    const schema = await createSchema(req.user, body, true)
    await audit.onCreateSchema(req, schema)

    return res.json({
      schema,
    })
  },
]
