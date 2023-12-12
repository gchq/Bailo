import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

export interface WebhookConfigInterface {
  uri: string
  token?: string
  insecureSSL?: boolean
}

export interface NotificationInterface {
  id: string
  modelId: string
  name: string
  config: WebhookConfigInterface
  events?: Array<string>
  active?: boolean
}

export type NotificationDoc = NotificationInterface & Document<any, any, NotificationInterface>

const NotificationSchema = new Schema<NotificationInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },
    modelId: { type: String, required: true },
    name: { type: String, required: true },

    config: {
      uri: { type: String, required: true },
      token: { type: String },
      insecureSSL: { type: Boolean },
    },

    events: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'v2_notifications',
  },
)

NotificationSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
})

const NotificationModel = model<NotificationInterface>('v2_Notification', NotificationSchema)

export default NotificationModel
