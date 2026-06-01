import { Request, Response } from 'express'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { z } from '../../../lib/zod.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { getSchemaById } from '../../../services/schema.js'
import { registerPath, schemaInterfaceSchema } from '../../../services/specification.js'
import config from '../../../utils/config.js'
import { parse } from '../../../utils/validate.js'

export const getSchemaSchema = z.object({
  params: z.object({
    schemaId: z.string(),
  }),
  query: z.object({
    modelState: z.enum(config.ui.modelDetails.states as [string, ...string[]]).optional(),
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
  async (req: Request, res: Response<GetSchemaResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewSchema
    const {
      query: { modelState },
      params: { schemaId },
    } = parse(req, getSchemaSchema)

    const schema = await getSchemaById(schemaId, modelState)
    await audit.onViewSchema(req, schema)

    res.json({
      schema,
    })
  },
]
