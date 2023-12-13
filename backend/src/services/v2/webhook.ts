import fetch from 'node-fetch'

import { NotificationEventKeys, NotificationInterface } from '../../models/v2/Notification.js'
import { UserDoc } from '../../models/v2/User.js'
import WebhookNotificationModel from '../../models/v2/WebhookNotification.js'
import { convertStringToId } from '../../utils/v2/id.js'
import { getModelById } from './model.js'
import { EventInformation } from './notification.js'

export type CreateWebhookParams = Pick<NotificationInterface, 'name' | 'modelId' | 'events' | 'active'>
export async function createWebhook(user: UserDoc, webhookParams: CreateWebhookParams) {
  //Check model exists and user has the permisson to view it
  await getModelById(user, webhookParams.modelId)

  const id = convertStringToId(webhookParams.name)
  const webhook = new WebhookNotificationModel({
    ...webhookParams,
    id,
  })

  // Add auth

  await webhook.save()
  return webhook
}

export async function sendWebhooks(eventKind: NotificationEventKeys, eventContent: EventInformation, modelId: string) {
  const webhooks = await WebhookNotificationModel.find({ modelId, events: eventKind })

  await Promise.all(
    webhooks.map((webhook) =>
      fetch(webhook.uri, {
        method: 'POST',
        body: JSON.stringify({ eventKind, description: eventContent.title, metadata: eventContent.metadata }),
        headers: { 'X-Foo': 'Bar' },
      }),
    ),
  )
}
