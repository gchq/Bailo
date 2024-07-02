import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

export const Decision = {
  RequestChanges: 'request_changes',
  Approve: 'approve',
  Undo: 'undo',
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
  reactions?: ResponseReaction[]

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
} as const
export type ReactionKindKeys = (typeof ReactionKind)[keyof typeof ReactionKind]

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ResponseDoc = ResponseInterface & Document<any, any, ResponseInterface>

const ResponseSchema = new Schema<ResponseInterface>(
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
})

const ResponseModel = model<ResponseInterface>('v2_response', ResponseSchema)

export default ResponseModel
