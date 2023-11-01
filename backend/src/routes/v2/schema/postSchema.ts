import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { SchemaInterface } from '../../../models/v2/Schema.js'
import { createSchema } from '../../../services/v2/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/v2/specification.js'
import { SchemaKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const postSchemaSchema = z.object({
  body: z.object({
    id: z.string({
      required_error: 'Must specify schema ID',
    }),
    name: z.string({
      required_error: 'Must specify schema name',
    }),

    kind: z.nativeEnum(SchemaKind, {
      required_error: 'Must specify schema kind',
    }),
    jsonSchema: z.object(
      {},
      {
        required_error: 'Must specify schema schema object',
      },
    ),
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
    const { body } = parse(req, postSchemaSchema)

    const schema = await createSchema(req.user, body)

    return res.json({
      schema,
    })
  },
]
