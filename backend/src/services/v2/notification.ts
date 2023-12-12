import fetch from 'node-fetch'

import Notification, { NotificationInterface } from '../../models/v2/Notification.js'
import { UserDoc } from '../../models/v2/User.js'
import log from '../../services/v2/log.js'
import { convertStringToId } from '../../utils/v2/id.js'
import { getModelById } from './model.js'

export const event = {
  CreateRelease: 'createRelease',
} as const
export type eventKeys = (typeof event)[keyof typeof event]

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

export async function sendWebhook(webhook: NotificationInterface) {
  fetch(webhook.config.uri, {
    method: 'POST',
    body: JSON.stringify({ key: 'value' }),
    headers: { 'X-Foo': 'Bar' },
  })
    .then((response) => response.text())
    .then((text) => log.info(text))
    .catch((err) => log.error(err))
}

export async function sendNotifications(event: eventKeys, modelId: string) {
  try {
    const query = {
      modelId,
      // Match documents where the element exists in the array
      events: event,
    }
    const notifications = await Notification.find(query)

    await Promise.all(notifications.map(async (notification) => sendWebhook(notification)))
  } catch (error) {
    log.error(error)
  }
}
