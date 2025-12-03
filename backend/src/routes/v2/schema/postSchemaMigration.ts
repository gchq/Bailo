import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { SchemaMigrationInterface } from '../../../models/SchemaMigration.js'
import { createSchemaMigrationPlan } from '../../../services/schemaMigration.js'
import { registerPath } from '../../../services/specification.js'
import { SchemaMigrationKind } from '../../../types/enums.js'
import { getEnumValues } from '../../../utils/enum.js'
import { parse } from '../../../utils/validate.js'

export const postSchemaMigrationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Must specify schema migration plan name',
    }),
    description: z.string().optional().openapi({ example: 'This is an example migration plan' }),
    sourceSchema: z.string().openapi({ example: 'v1' }),
    targetSchema: z.string().openapi({ example: 'v2' }),
    draft: z.coerce.boolean().optional().default(false),
    questionMigrations: z.array(
      z.object({
        id: z.string(),
        kind: z.enum(getEnumValues(SchemaMigrationKind)),
        sourcePath: z.string().openapi({ example: 'section1.question1' }),
        targetPath: z.string().optional().openapi({ example: 'section2.question1' }),
        propertyType: z.string().openapi({ example: 'string' }),
      }),
    ),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/schema-migration',
  tags: ['schema-migrations'],
  description: 'Create a new schema migration plan.',
  schema: postSchemaMigrationSchema,
  responses: {
    200: {
      description: 'The created schema migration plan instance.',
      content: {
        'application/json': {
          schema: z.object({
            schemaMigration: postSchemaMigrationSchema,
          }),
        },
      },
    },
  },
})

interface PostSchemaMigrationPlanResponse {
  schemaMigration: SchemaMigrationInterface
}

export const postSchemaMigration = [
  async (req: Request, res: Response<PostSchemaMigrationPlanResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateSchemaMigration
    const { body } = parse(req, postSchemaMigrationSchema)

    const schemaMigration = await createSchemaMigrationPlan(req.user, body)
    await audit.onCreateSchemaMigration(req, schemaMigration)

    res.json({
      schemaMigration,
    })
  },
]
