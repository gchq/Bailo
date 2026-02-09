import { Request, Response } from 'express'

import { AuditInfo } from '../../../../connectors/audit/Base.js'
import audit from '../../../../connectors/audit/index.js'
import { z } from '../../../../lib/zod.js'
import { softDeleteImage } from '../../../../services/registry.js'
import { registerPath } from '../../../../services/specification.js'
import { parse } from '../../../../utils/validate.js'

export const deleteImageSchema = z.object({
  params: z.object({
    modelId: z.string(),
    name: z.string(),
    tag: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}/image/{name}/{tag}',
  tags: ['image'],
  description: 'Delete an image from a model.',
  schema: deleteImageSchema,
  responses: {
    200: {
      description: 'A message confirming the removal of the image.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed image' }),
          }),
        },
      },
    },
  },
})

interface DeleteImageResponse {
  message: string
}

export const deleteImage = [
  async (req: Request, res: Response<DeleteImageResponse>): Promise<void> => {
    req.audit = AuditInfo.DeleteImage
    const {
      params: { modelId, name, tag },
    } = parse(req, deleteImageSchema)

    await softDeleteImage(req.user, { repository: modelId, name, tag })
    await audit.onDeleteImage(req, modelId, {
      name,
      tag,
      repository: modelId,
    })

    res.json({
      message: 'Successfully removed image.',
    })
  },
]
