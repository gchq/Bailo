import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { updateSchema } from '../../../services/v2/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/v2/specification.js'
import { SchemaKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const patchSchemaSchema = z.object({
  params: z.object({
    schemaId: z.string({
      required_error: 'Must specify schema id as URL parameter',
    }),
  }),
  body: z.object({
    id: z
      .string({
        required_error: 'Must specify schema ID',
      })
      .optional(),
    name: z
      .string({
        required_error: 'Must specify schema name',
      })
      .optional(),
    description: z
      .string({
        required_error: 'Must specify schema description',
      })
      .optional(),
    kind: z
      .nativeEnum(SchemaKind, {
        required_error: 'Must specify schema kind',
      })
      .optional(),
    active: z
      .boolean({
        required_error: 'Must specify is schema is active or not',
      })
      .optional(),
    jsonSchema: z.object({}).passthrough().optional(),
  }),
})

registerPath({
  method: 'put',
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
