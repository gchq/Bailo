import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaMigrationInterface } from '../../../models/SchemaMigration.js'
import { updateSchemaMigrationPlan } from '../../../services/schemaMigration.js'
import { registerPath } from '../../../services/specification.js'
import { SchemaMigrationKind } from '../../../types/enums.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

export const putSchemaMigrationSchema = z.object({
  params: z.object({
    schemaMigrationId: z.string().openapi({ example: 'yolo-v4-abcdef' }),
  }),
  body: z.object({
    name: z.string(),
    description: z.string().openapi({ example: 'This is an example migration plan' }),
    questionMigrations: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(getEnumValues(SchemaMigrationKind)),
        sourcePath: z.string().openapi({ example: 'section1.question1' }),
        targetPath: z.string().optional().openapi({ example: 'section2.question1' }),
        propertyType: z.string().openapi({ example: 'string' }),
      }),
    ),
    draft: z.boolean(),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/schema-migration',
  tags: ['schema-migrations'],
  description: 'Update existing schema migration plan.',
  schema: putSchemaMigrationSchema,
  responses: {
    200: {
      description: 'Updated schema migration plan instance.',
      content: {
        'application/json': {
          schema: z.object({
            schemaMigration: putSchemaMigrationSchema,
          }),
        },
      },
    },
  },
})

interface PutSchemaMigrationPlanResponse {
  schemaMigration: SchemaMigrationInterface
}

export const putSchemaMigration = [
  async (req: Request, res: Response<PutSchemaMigrationPlanResponse>): Promise<void> => {
    req.audit = AuditInfo.UpdateSchemaMigration
    const { params, body } = parse(req, putSchemaMigrationSchema)

    const schemaMigration = await updateSchemaMigrationPlan(req.user, params.schemaMigrationId, body)
    await audit.onUpdateSchemaMigration(req, schemaMigration)

    res.json({
      schemaMigration,
    })
  },
]
