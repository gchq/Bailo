import { model, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

export const WebhookEvent = {
  CreateRelease: 'createRelease',
  UpdateRelease: 'updateRelease',
  CreateReviewResponse: 'createReviewResponse',
  CreateAccessRequest: 'createAccessRequest',
} as const
export type WebhookEventKeys = (typeof WebhookEvent)[keyof typeof WebhookEvent]

export interface WebhookInterface {
  id: string
  modelId: string
  name: string
  uri: string
  token?: string
  insecureSSL: boolean
  events?: Array<WebhookEventKeys>
  active?: boolean
}

export type WebhookDoc = WebhookInterface & SoftDeleteDocument

const WebhookSchema = new Schema<WebhookDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    modelId: { type: String, required: true },
    name: { type: String, required: true },

    uri: { type: String, required: true },
    token: { type: String },
    insecureSSL: { type: Boolean, required: true },

    events: [{ type: String, enum: Object.values(WebhookEvent) }],
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'v2_webhooks',
  },
)

WebhookSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
  deletedAt: true,
})

const WebhookModel = model<WebhookDoc>('v3_Webhook', WebhookSchema)

export default WebhookModel
