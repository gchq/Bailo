import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { WebhookEvent, WebhookInterface } from '../../../../models/Webhook.js'
import { registerPath, webhookInterfaceSchema } from '../../../../services/v2/specification.js'
import { createWebhook } from '../../../../services/v2/webhook.js'
import { parse } from '../../../../utils/v2/validate.js'

export const postWebhookSchema = z.object({
  params: z.object({
    modelId: z.string(),
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
  method: 'post',
  path: '/api/v2/model/{modelId}/webhooks',
  tags: ['webhook'],
  description: 'Create a new webhook instance.',
  schema: postWebhookSchema,
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

interface PostWebhookResponse {
  webhook: WebhookInterface
}

export const postWebhook = [
  bodyParser.json(),
  async (req: Request, res: Response<PostWebhookResponse>) => {
    const {
      params: { modelId },
      body,
    } = parse(req, postWebhookSchema)

    const webhook = await createWebhook(req.user, { modelId, ...body })

    return res.json({
      webhook,
    })
  },
]
