import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

export const NotificationEvent = {
  CreateRelease: 'createRelease',
} as const
export type NotificationEventKeys = (typeof NotificationEvent)[keyof typeof NotificationEvent]

export interface NotificationInterface {
  id: string
  modelId: string
  name: string
  events?: Array<NotificationEventKeys>
  active?: boolean
}

export type NotificationDoc = NotificationInterface & Document<any, any, NotificationInterface>

const NotificationSchema = new Schema<NotificationInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },
    modelId: { type: String, required: true },
    name: { type: String, required: true },

    events: [{ type: String, enum: Object.values(NotificationEvent) }],
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'v2_notifications',
    discriminatorKey: 'kind',
  },
)

NotificationSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
})

const NotificationModel = model<NotificationInterface>('v2_Notification', NotificationSchema)

export default NotificationModel
