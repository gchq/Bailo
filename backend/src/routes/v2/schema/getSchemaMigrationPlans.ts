import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaInterface } from '../../../models/Schema.js'
import { getSchemaById } from '../../../services/schema.js'
import { registerPath, schemaMigrationInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'
import { SchemaMigrationInterface } from '../../../models/SchemaMigration.js'
import { getSchemaMigrations } from '../../../services/schemaMigration.js'

export const getSchemaMigrationsSchema = z.object({})

registerPath({
  method: 'get',
  path: '/api/v2/schema/getSchemaMigrationsSchema',
  tags: ['schema-migrations'],
  description: 'Get a specific schema instance.',
  schema: getSchemaMigrationsSchema,
  responses: {
    200: {
      description: 'A schema instance.',
      content: {
        'application/json': {
          schema: z.object({
            schemaMigrations: schemaMigrationInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface GetSchemaMigrationsResponse {
  schemaMigrations: SchemaMigrationInterface[]
}

export const getSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaMigrationsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewSchemaMigrations

    const schemaMigrations = await getSchemaMigrations()
    await audit.onViewSchemaMigrations(req, schemaMigrations)

    res.json({
      schemaMigrations,
    })
  },
]
