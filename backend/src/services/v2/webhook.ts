import fetch from 'node-fetch'

import Notification, { NotificationEventKeys, NotificationInterface } from '../../models/v2/Notification.js'
import { UserDoc } from '../../models/v2/User.js'
import log from '../../services/v2/log.js'
import { convertStringToId } from '../../utils/v2/id.js'
import { getModelById } from './model.js'
import { EventInformation } from './notification.js'

export type CreateWebhookParams = Pick<NotificationInterface, 'name' | 'modelId' | 'config' | 'events' | 'active'>
export async function createWebhook(user: UserDoc, webhookParams: CreateWebhookParams) {
  //Check model exists and user has the permisson to view it
  await getModelById(user, webhookParams.modelId)

  const id = convertStringToId(webhookParams.name)
  const webhook = new Notification({
    ...webhookParams,
    id,
  })

  // Add auth

  await webhook.save()
  return webhook
}

export async function sendWebhook(
  eventKind: NotificationEventKeys,
  webhook: NotificationInterface,
  content: EventInformation,
) {
  //TODO Convert to await
  fetch(webhook.config.uri, {
    method: 'POST',
    body: JSON.stringify({ eventKind, description: content.title, metadata: content.metadata }),
    headers: { 'X-Foo': 'Bar' },
  })
    .then((response) => response.text())
    .then((text) => log.info(text))
    .catch((err) => log.error(err))
}
