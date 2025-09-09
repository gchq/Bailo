import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'
import { SchemaMigrationInterface } from '../../../models/SchemaMigration.js'
import { createSchemaMigrationPlan } from '../../../services/schemaMigration.js'

export const postSchemaSchemaMigrationPlan = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Must specify schema migration plan name',
    }),
    questionMigrations: z.array(
      z.object({
        id: z.string(),
        kind: z.string().openapi({ example: 'move' }),
        sourcePath: z.string().openapi({ example: 'section1.question1' }),
        targetPath: z.string().optional().openapi({ example: 'section2.question1' }),
        propertyType: z.string().openapi({ example: 'string' }),
      }),
    ),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/schema/migrations',
  tags: ['schema-migrations'],
  description: 'Create a new schema migration plan.',
  schema: postSchemaSchemaMigrationPlan,
  responses: {
    200: {
      description: 'The created schema migration plan instance.',
      content: {
        'application/json': {
          schema: z.object({
            schema: postSchemaSchemaMigrationPlan,
          }),
        },
      },
    },
  },
})

interface PostSchemaMigrationPlanResponse {
  schemaMigration: SchemaMigrationInterface
}

export const postSchemaMigrationPlan = [
  bodyParser.json(),
  async (req: Request, res: Response<PostSchemaMigrationPlanResponse>): Promise<void> => {
    req.audit = AuditInfo.CreateSchemaMigration
    const { body } = parse(req, postSchemaSchemaMigrationPlan)

    const schemaMigration = await createSchemaMigrationPlan(req.user, body)
    await audit.onCreateSchemaMigration(req, schemaMigration)

    res.json({
      schemaMigration,
    })
  },
]
