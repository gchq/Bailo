import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

import { runModelSchemaMigration } from '../../../services/schemaMigration.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postMigrateModelSchemaSchema = z.object({
  params: z.object({
    modelId: z.string().openapi({ example: 'my-model-51fd4' }),
    migrationId: z.string().openapi({ example: new ObjectId().toString() }),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/migrate-schema/{migrationId}',
  tags: ['schema-migrations'],
  description: 'Run a migration plan for a model.',
  schema: postMigrateModelSchemaSchema,
  responses: {
    200: {
      description: 'A response saying that the migration was completed successfully',
      content: {
        'application/json': {
          schema: z.object({
            response: z.string(),
          }),
        },
      },
    },
  },
})

interface postMigrateModelSchemaResponse {
  response: string
}

export const postMigrateModelSchema = [
  async (req: Request, res: Response<postMigrateModelSchemaResponse>): Promise<void> => {
    //req.audit = AuditInfo.CreateSchemaMigration
    const {
      params: { modelId, migrationId },
    } = parse(req, postMigrateModelSchemaSchema)

    await runModelSchemaMigration(req.user, modelId, migrationId)
    //await audit.onCreateSchemaMigration(req, schemaMigration)

    res.json({
      response: 'Successfully migrated model schema',
    })
  },
]
