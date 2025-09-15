import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaMigrationInterface } from '../../../models/SchemaMigration.js'
import { searchSchemaMigrations } from '../../../services/schemaMigration.js'
import { registerPath, schemaMigrationInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getSchemaMigrationsSchema = z.object({
  params: z.object({
    name: z.string().optional().openapi({ example: 'My Schema Migration' }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/schema-migrations',
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

export const getSchemaMigrations = [
  bodyParser.json(),
  async (req: Request, res: Response<GetSchemaMigrationsResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewSchemaMigrations
    const { params } = parse(req, getSchemaMigrationsSchema)

    const schemaMigrations = await searchSchemaMigrations(params.name)
    await audit.onViewSchemaMigrations(req, schemaMigrations)

    res.json({
      schemaMigrations,
    })
  },
]
