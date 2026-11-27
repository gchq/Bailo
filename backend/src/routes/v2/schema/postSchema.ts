import { type Request, type Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { type SchemaInterface } from '../../../models/Schema.js'
import { createSchema } from '../../../services/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/specification.js'
import { SchemaKind } from '../../../types/enums.js'
import { parse } from '../../../utils/validate.js'

export const postSchemaSchema = z.object({
  body: z.object({
    id: z.string({
      error: (issue) => (issue.input === undefined ? 'Must specify schema ID' : undefined),
    }),
    name: z.string({
      error: (issue) => (issue.input === undefined ? 'Must specify schema name' : undefined),
    }),
    description: z.string({
      error: (issue) => (issue.input === undefined ? 'Must specify schema description' : undefined),
    }),
    kind: z.enum(SchemaKind, {
      error: (issue) => (issue.input === undefined ? 'Must specify schema kind' : undefined),
    }),
    jsonSchema: z.object({}).loose(),
    reviewRoles: z.array(z.string()).openapi({
      example: ['reviewer'],
      description: 'This is an array made up of the "shortName" property from a Review Role object.',
    }),
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
  async (req: Request, res: Response<PostSchemaResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateSchema
    const { body } = parse(req, postSchemaSchema)

    const schema = await createSchema(req.user, body)
    await audit.onCreateSchema(req, schema)

    res.json({
      schema,
    })
  },
]
