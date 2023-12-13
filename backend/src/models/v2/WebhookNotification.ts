import { Schema } from 'mongoose'

import Notification, { NotificationInterface } from './Notification.js'

export interface WebhookConfigInterface {
  uri: string
  token?: string
  insecureSSL?: boolean
}

const WebhookNotificationSchema = new Schema<WebhookConfigInterface>(
  {
    uri: { type: String, required: true },
    token: { type: String },
    insecureSSL: { type: Boolean },
  },
  { discriminatorKey: 'kind' },
)

const WebhookNotificationModel = Notification.discriminator<WebhookConfigInterface & NotificationInterface>(
  'Webhook',
  WebhookNotificationSchema,
)

export default WebhookNotificationModel
