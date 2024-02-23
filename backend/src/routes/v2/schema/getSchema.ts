import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { findSchemaById } from '../../../services/v2/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const getSchemaSchema = z.object({
  params: z.object({
    schemaId: z.string({
      required_error: 'Must specify schema id as URL parameter',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/schema/{schemaId}',
  tags: ['schema'],
  description: 'Get a specific schema instance.',
  schema: getSchemaSchema,
  responses: {
    200: {
      description: 'A schema instance.',
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

interface GetSchemaResponse {
  schema: SchemaInterface
}

export const getSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaResponse>) => {
    req.audit = AuditInfo.ViewSchema
    const { params } = parse(req, getSchemaSchema)

    const schema = await findSchemaById(params.schemaId)
    await audit.onViewSchema(req, schema)

    return res.json({
      schema,
    })
  },
]
