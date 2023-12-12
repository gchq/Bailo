import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { NotificationInterface } from '../../../../models/v2/Notification.js'
import { createWebhook } from '../../../../services/v2/notification.js'
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

    events: z.array(z.string()).optional(),
    active: z.boolean().optional(),
  }),
})

//Add Open API Spec

interface PostWebhookResponse {
  webhook: NotificationInterface
}

export const postWebhook = [
  bodyParser.json(),
  async (req: Request, res: Response<PostWebhookResponse>) => {
    //req.audit = AuditInfo.CreateRelease
    const {
      params: { modelId },
      body,
    } = parse(req, postWebhookSchema)

    const webhook = await createWebhook(req.user, { modelId, ...body })
    //await audit.onCreateRelease(req, release)

    return res.json({
      webhook,
    })
  },
]
