import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../../../middleware/validate.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { createSchema } from '../../../services/v2/schema.js'
import { SchemaKind } from '../../../types/v2/enums.js'
import { ensureUserRole } from '../../../utils/user.js'

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
    meta: z.object(
      {},
      {
        required_error: 'Must specify schema metadata',
      }
    ),

    uiSchema: z.object(
      {},
      {
        required_error: 'Must specify schema UI schema object',
      }
    ),
    schema: z.object(
      {},
      {
        required_error: 'Must specify schema schema object',
      }
    ),
  }),
})

interface GetSchemaResponse {
  data: {
    schema: SchemaInterface
  }
}

export const postSchema = [
  ensureUserRole('admin'),
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaResponse>) => {
    const { body } = parse(req, postSchemaSchema)

    const schema = await createSchema(body)

    return res.json({
      data: {
        schema,
      },
    })
  },
]
