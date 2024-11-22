import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { getSchemaById } from '../../../services/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getSchemaSchema = z.object({
  params: z.object({
    schemaId: z.string(),
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

    const schema = await getSchemaById(params.schemaId)
    await audit.onViewSchema(req, schema)

    return res.json({
      schema,
    })
  },
]
