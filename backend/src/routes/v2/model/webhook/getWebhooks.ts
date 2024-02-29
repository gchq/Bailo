import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { WebhookInterface } from '../../../../models/Webhook.js'
import { registerPath, webhookInterfaceSchema } from '../../../../services/specification.js'
import { getWebhooksByModel } from '../../../../services/webhook.js'
import { parse } from '../../../../utils/validate.js'

export const getWebhooksSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/webhooks',
  tags: ['webhook'],
  description: 'Get all webhooks for a model.',
  schema: getWebhooksSchema,
  responses: {
    200: {
      description: 'An array of webhook instances.',
      content: {
        'application/json': {
          schema: z.object({
            webhooks: z.array(webhookInterfaceSchema),
          }),
        },
      },
    },
  },
})

interface GetWebhooksResponse {
  webhooks: Array<WebhookInterface>
}

export const getWebhooks = [
  bodyParser.json(),
  async (req: Request, res: Response<GetWebhooksResponse>) => {
    const {
      params: { modelId },
    } = parse(req, getWebhooksSchema)

    const webhooks = await getWebhooksByModel(req.user, modelId)

    return res.json({
      webhooks,
    })
  },
]
