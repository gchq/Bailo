import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaMigrationInterface } from '../../../models/SchemaMigration.js'
import { searchSchemaMigrationById } from '../../../services/schemaMigration.js'
import { registerPath, schemaMigrationInterfaceSchema } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const getSchemaMigrationSchema = z.object({
  params: z.object({
    schemaMigrationId: z.string().openapi({ example: 'schema-migration-4f3f5' }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/schema-migration/{schemaMigrationId}',
  tags: ['schema-migrations'],
  description: 'Get a specific schema instance.',
  schema: getSchemaMigrationSchema,
  responses: {
    200: {
      description: 'A schema instance.',
      content: {
        'application/json': {
          schema: z.object({
            schemaMigration: schemaMigrationInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface GetSchemaMigrationResponse {
  schemaMigration: SchemaMigrationInterface
}

export const getSchemaMigration = [
  async (req: Request, res: Response<GetSchemaMigrationResponse>): Promise<void> => {
    req.audit = AuditInfo.ViewSchemaMigration
    const {
      params: { schemaMigrationId },
    } = parse(req, getSchemaMigrationSchema)

    const schemaMigration = await searchSchemaMigrationById(schemaMigrationId)
    await audit.onViewSchemaMigration(req, schemaMigration)

    res.json({
      schemaMigration,
    })
  },
]
