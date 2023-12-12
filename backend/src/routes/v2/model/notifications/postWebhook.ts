import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { NotificationEvent, NotificationInterface } from '../../../../models/v2/Notification.js'
import { createWebhook } from '../../../../services/v2/webhook.js'
import { parse } from '../../../../utils/v2/validate.js'

export const postWebhookSchema = z.object({
  params: z.object({
    modelId: z.string(),
  }),
  body: z.object({
    name: z.string(),

    config: z.object({
      uri: z.string(),
      token: z.string().optional(),
      insecureSSL: z.boolean().optional(),
    }),

    events: z.array(z.nativeEnum(NotificationEvent)).optional(),
    active: z.boolean().optional(),
  }),
})

//TODO Add Open API Spec

interface PostWebhookResponse {
  webhook: NotificationInterface
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
