import fetch, { HeadersInit } from 'node-fetch'

import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { AccessRequestDoc } from '../models/AccessRequest.js'
import { ModelTransferDoc } from '../models/ModelTransfer.js'
import { ReleaseDoc } from '../models/Release.js'
import { ReviewInterface } from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import WebhookModel, { WebhookEventKeys, WebhookInterface } from '../models/Webhook.js'
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
  // Check model exists and user has the permission to update it
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
  // Check model exists and user has the permission to update it
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

type WebhookContent =
  | { release: ReleaseDoc }
  | { review: ReviewInterface }
  | { accessRequest: AccessRequestDoc }
  | { transfer: ModelTransferDoc }

/**
 * Sends webhooks in an `await`able manner.
 *
 * Webhook delivery is best-effort and must never affect the primary operation (e.g. creating a release).
 * Errors are swallowed and logged so they cannot reject into the caller or crash the process.
 *
 * @param modelId The ID of the model the webhooks are registered against.
 * @param eventKind The webhook event type that has occurred.
 * @param eventTitle A human-readable description of the event.
 * @param content The event payload (release, review, access request, transfer etc.).
 */
export async function sendWebhooks(
  modelId: string,
  eventKind: WebhookEventKeys,
  eventTitle: string,
  content: WebhookContent,
) {
  const webhooks = await WebhookModel.find({ modelId, events: eventKind })

  for (const webhook of webhooks) {
    let headers: HeadersInit | undefined
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
        headers: { 'Content-Type': 'application/json', ...headers },
      })
      if (!response.ok) {
        log.error(
          { eventKind, response: { status: response.status, body: await response.text() } },
          'Non 200 response received when sending Webhook.',
        )
      } else {
        log.debug({ webhook, event: eventKind }, 'Successfully sent webhook')
      }
    } catch (err) {
      log.error({ eventKind, err }, 'Unable to send Webhook.')
    }
  }
}

/**
 * Dispatches webhooks without blocking the caller.
 *
 * Webhook delivery is best-effort and must never affect the primary operation (e.g. creating a release).
 * Errors are swallowed and logged so they cannot reject into the caller or crash the process.
 *
 * @param modelId The ID of the model the webhooks are registered against.
 * @param eventKind The webhook event type that has occurred.
 * @param eventTitle A human-readable description of the event.
 * @param content The event payload (release, review, access request, transfer etc.).
 */
export function dispatchWebhooks(
  modelId: string,
  eventKind: WebhookEventKeys,
  eventTitle: string,
  content: WebhookContent,
): void {
  sendWebhooks(modelId, eventKind, eventTitle, content).catch((err) => {
    log.error({ err, eventKind, modelId }, 'Failed to dispatch webhooks.')
  })
}
