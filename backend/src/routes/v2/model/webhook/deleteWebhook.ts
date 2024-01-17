import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { registerPath } from '../../../../services/v2/specification.js'
import { removeWebhook } from '../../../../services/v2/webhook.js'
import { parse } from '../../../../utils/v2/validate.js'

export const deleteWebhookSchema = z.object({
  params: z.object({
    modelId: z.string(),
    webhookId: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}/webhooks/{webhookId}',
  tags: ['webhook'],
  description: 'Delete a file from a model.',
  schema: deleteWebhookSchema,
  responses: {
    200: {
      description: 'A message confirming the removal of the webhook.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed webhook' }),
          }),
        },
      },
    },
  },
})

interface DeleteWebhookResponse {
  message: string
}

export const deleteWebhook = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteWebhookResponse>) => {
    const {
      params: { modelId, webhookId },
    } = parse(req, deleteWebhookSchema)

    await removeWebhook(req.user, modelId, webhookId)

    return res.json({
      message: 'Successfully removed file.',
    })
  },
]
