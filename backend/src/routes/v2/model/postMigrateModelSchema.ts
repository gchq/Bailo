import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/audit/Base.js'
import audit from '../../../connectors/audit/index.js'
import { runModelSchemaMigration } from '../../../services/schemaMigration.js'
import { registerPath } from '../../../services/specification.js'
import { parse } from '../../../utils/validate.js'

export const postMigrateModelSchemaSchema = z.object({
  params: z.object({
    modelId: z.string().openapi({ example: 'my-model-51fd4' }),
    migrationId: z.string().openapi({ example: 'my-plan-4f35g' }),
  }),
  body: z.object({}).optional(),
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
    req.audit = AuditInfo.UpdateModelCard
    const {
      params: { modelId, migrationId },
    } = parse(req, postMigrateModelSchemaSchema)

    const updatedModel = await runModelSchemaMigration(req.user, modelId, migrationId)
    await audit.onUpdateModel(req, updatedModel)

    res.json({
      response: 'Successfully migrated model schema',
    })
  },
]
