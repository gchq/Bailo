import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { updateSchema } from '../../../services/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const patchSchemaSchema = z.object({
  params: z.object({
    schemaId: z.string({
      required_error: 'Must specify schema id as URL parameter',
    }),
  }),
  body: z
    .object({
      active: z.boolean().openapi({ example: true }).optional(),
      hidden: z.boolean().openapi({ example: false }).optional(),
      name: z.string().openapi({ example: 'Test Schema v1' }).optional(),
      description: z.string().openapi({ example: 'This is an example of schema description' }).optional(),
    })
    .strict(),
})

registerPath({
  method: 'patch',
  path: '/api/v2/schema/{schemaId}',
  tags: ['schema'],
  description: 'Update partial fields for an existing schema.',
  schema: patchSchemaSchema,
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

interface PatchSchemaResponse {
  schema: SchemaInterface
}

export const patchSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchSchemaResponse>) => {
    req.audit = AuditInfo.UpdateSchema
    const { body, params } = parse(req, patchSchemaSchema)
    const schema = await updateSchema(req.user, params.schemaId, body)
    await audit.onUpdateSchema(req, schema)

    return res.json({
      schema,
    })
  },
]
