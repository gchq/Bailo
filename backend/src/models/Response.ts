import { model, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

export const Decision = {
  RequestChanges: 'request_changes',
  Approve: 'approve',
  Undo: 'undo',
  Deny: 'deny',
} as const
export type DecisionKeys = (typeof Decision)[keyof typeof Decision]

export const ResponseKind = {
  Review: 'review',
  Comment: 'comment',
} as const
export type ResponseKindKeys = (typeof ResponseKind)[keyof typeof ResponseKind]

export interface ResponseInterface {
  entity: string
  kind: ResponseKindKeys
  role?: string
  decision?: DecisionKeys
  comment?: string
  parentId: Schema.Types.ObjectId
  reactions: ResponseReaction[]
  commentEditedAt?: string

  createdAt: string
  updatedAt: string
}

export interface ResponseReaction {
  kind: ReactionKindKeys
  users: string[]
}

export const ReactionKind = {
  LIKE: 'like',
  DISLIKE: 'dislike',
  CELEBRATE: 'celebrate',
  HEART: 'heart',
} as const
export type ReactionKindKeys = (typeof ReactionKind)[keyof typeof ReactionKind]

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ResponseDoc = ResponseInterface & SoftDeleteDocument

const ResponseSchema = new Schema<ResponseDoc>(
  {
    entity: { type: String, required: true },
    kind: { type: String, enum: Object.values(ResponseKind), required: true },
    role: { type: String },
    decision: { type: String, enum: Object.values(Decision) },
    comment: { type: String },
    parentId: { type: Schema.Types.ObjectId, required: true },
    reactions: [
      {
        kind: { type: String, enum: Object.values(ReactionKind) },
        users: [{ type: String }],
      },
    ],
    commentEditedAt: { type: String },
  },
  {
    timestamps: true,
    collection: 'v2_responses',
  },
)

ResponseSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: String,
  deletedAt: true,
})

const ResponseModel = model<ResponseDoc>('v2_response', ResponseSchema)

export default ResponseModel
