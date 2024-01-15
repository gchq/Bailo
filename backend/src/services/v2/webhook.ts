import fetch from 'node-fetch'

import { ModelAction } from '../../connectors/v2/authorisation/base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { AccessRequestDoc } from '../../models/v2/AccessRequest.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import { ReviewInterface } from '../../models/v2/Review.js'
import { UserDoc } from '../../models/v2/User.js'
import { WebhookEventKeys, WebhookInterface } from '../../models/v2/Webhook.js'
import WebhookModel from '../../models/v2/Webhook.js'
import { Forbidden } from '../../utils/v2/error.js'
import { convertStringToId } from '../../utils/v2/id.js'
import { getHttpsAgent } from './http.js'
import log from './log.js'
import { getModelById } from './model.js'

export type CreateWebhookParams = Pick<
  WebhookInterface,
  'name' | 'modelId' | 'uri' | 'token' | 'insecureSSL' | 'events' | 'active'
>
export async function createWebhook(user: UserDoc, webhookParams: CreateWebhookParams) {
  //Check model exists and user has the permisson to update it
  const model = await getModelById(user, webhookParams.modelId)
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(`You do not have permission to update this model.`, { userDn: user.dn })
  }

  const id = convertStringToId(webhookParams.name)
  const webhook = new WebhookModel({
    ...webhookParams,
    id,
  })

  await webhook.save()
  return webhook
}

export async function removeWebhook(user: UserDoc, modelId: string, webhookId: string) {
  const model = await getModelById(user, modelId)
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(`You do not have permission to update this model.`, { userDn: user.dn })
  }
  WebhookModel.deleteOne({ id: webhookId })
}

export async function sendWebhooks(
  modelId: string,
  eventKind: WebhookEventKeys,
  eventTitle: string,
  content: { release: ReleaseDoc } | { review: ReviewInterface } | { accessRequest: AccessRequestDoc },
) {
  const webhooks = await WebhookModel.find({ modelId, events: eventKind })

  for (const webhook of webhooks) {
    let headers
    if (webhook.token) {
      headers = {
        Authorization: `Bearer ${webhook.token}`,
      }
    } else {
      headers = {}
    }
    try {
      const response = await fetch(webhook.uri, {
        method: 'POST',
        body: JSON.stringify({ event: eventKind, description: eventTitle, ...content }),
        agent: getHttpsAgent({
          rejectUnauthorized: webhook.insecureSSL,
        }),
        headers,
      })
      if (!response.ok) {
        log.error({ eventKind, response }, 'Non 200 response received when sending Webhook.')
      }
    } catch (err) {
      log.error({ eventKind, err }, 'Unable to send Webhook.')
    }
  }
}
