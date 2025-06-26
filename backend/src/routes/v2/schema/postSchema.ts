import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { createSchema } from '../../../services/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/specification.js'
import { SchemaKind } from '../../../types/enums.js'
import { parse } from '../../../utils/validate.js'

export const postSchemaSchema = z.object({
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
    jsonSchema: z.object({}).passthrough(),
    reviewRoles: z.array(z.string({ required_error: 'Must specify associated review roles' })),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/schemas',
  tags: ['schema'],
  description: 'Create a new schema.',
  schema: postSchemaSchema,
  responses: {
    200: {
      description: 'The created schema instance.',
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

interface PostSchemaResponse {
  schema: SchemaInterface
}

export const postSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<PostSchemaResponse>) => {
    req.audit = AuditInfo.CreateSchema
    const { body } = parse(req, postSchemaSchema)

    const schema = await createSchema(req.user, body)
    await audit.onCreateSchema(req, schema)

    return res.json({
      schema,
    })
  },
]
