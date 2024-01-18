import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { WebhookEvent, WebhookInterface } from '../../../../models/v2/Webhook.js'
import { registerPath, webhookInterfaceSchema } from '../../../../services/v2/specification.js'
import { updateWebhook } from '../../../../services/v2/webhook.js'
import { parse } from '../../../../utils/v2/validate.js'

export const putWebhookSchema = z.object({
  params: z.object({
    modelId: z.string(),
    webhookId: z.string(),
  }),
  body: z.object({
    name: z.string(),

    uri: z.string(),
    token: z.string().optional(),
    insecureSSL: z.boolean().optional().default(false),

    events: z.array(z.nativeEnum(WebhookEvent)).optional(),
    active: z.boolean().optional(),
  }),
})

registerPath({
  method: 'put',
  path: '/api/v2/model/{modelId}/webhooks/{webhookId}',
  tags: ['webhook'],
  description: 'Update a webhook instance.',
  schema: putWebhookSchema,
  responses: {
    200: {
      description: 'A Webhook instance.',
      content: {
        'application/json': {
          schema: z.object({ webhook: webhookInterfaceSchema }),
        },
      },
    },
  },
})

interface PutWebhookResponse {
  webhook: WebhookInterface
}

export const putWebhook = [
  bodyParser.json(),
  async (req: Request, res: Response<PutWebhookResponse>) => {
    const {
      params: { modelId, webhookId },
      body,
    } = parse(req, putWebhookSchema)

    const webhook = await updateWebhook(req.user, webhookId, { modelId, ...body })

    return res.json({
      webhook,
    })
  },
]
