import fetch from 'node-fetch'

import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { AccessRequestDoc } from '../models/AccessRequest.js'
import { ReleaseDoc } from '../models/Release.js'
import { ReviewInterface } from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import { WebhookEventKeys, WebhookInterface } from '../models/Webhook.js'
import WebhookModel from '../models/Webhook.js'
import { Forbidden, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { getHttpsAgent } from './http.js'
import log from './log.js'
import { getModelById } from './model.js'

export type CreateWebhookParams = Pick<
  WebhookInterface,
  'name' | 'modelId' | 'uri' | 'token' | 'insecureSSL' | 'events' | 'active'
>
export async function createWebhook(user: UserInterface, webhookParams: CreateWebhookParams) {
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

export async function updateWebhook(user: UserInterface, webhookId: string, webhookParams: CreateWebhookParams) {
  //Check model exists and user has the permisson to update it
  const model = await getModelById(user, webhookParams.modelId)
  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(`You do not have permission to update this model.`, { userDn: user.dn })
  }

  const webhook = await WebhookModel.findOneAndUpdate({ id: webhookId }, webhookParams, { new: true })
  if (!webhook) {
    throw NotFound(`The requested webhook was not found.`, { webhookId })
  }

  return webhook
}

export async function getWebhooksByModel(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)
  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(`You do not have permission to update this model.`, { userDn: user.dn })
  }

  return await WebhookModel.find({ modelId })
}

export async function removeWebhook(user: UserInterface, modelId: string, webhookId: string) {
  const auth = await authorisation.model(user, await getModelById(user, modelId), ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(`You do not have permission to update this model.`, { userDn: user.dn })
  }
  const webhook = await WebhookModel.findOneAndDelete({ id: webhookId })
  if (!webhook) {
    throw NotFound(`The requested webhook was not found.`, { webhookId })
  }
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
