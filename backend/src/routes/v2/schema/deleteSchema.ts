import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { deleteSchemaById } from '../../../services/v2/schema.js'
import { registerPath } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const deleteSchemaSchema = z.object({
  params: z.object({
    schemaId: z.string({
      required_error: 'Must specify schema id as URL parameter',
    }),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/schema/{schemaId}',
  tags: ['schema'],
  description: 'Delete an existing schema.',
  schema: deleteSchemaSchema,
  responses: {
    200: {
      description: 'Returns true if schema deleted.',
      content: {
        'application/json': {
          schema: z.object({
            deleted: z.boolean(),
          }),
        },
      },
    },
  },
})

interface DeletedSchemaResponse {
  deleted: boolean
}

export const deleteSchema = [
  bodyParser.json(),
  async (req: Request, res: Response<DeletedSchemaResponse>) => {
    req.audit = AuditInfo.DeleteSchema
    const { params } = parse(req, deleteSchemaSchema)

    await deleteSchemaById(req.user, params.schemaId)
    await audit.onDeleteSchema(req, params.schemaId)

    return res.json({
      deleted: true,
    })
  },
]
