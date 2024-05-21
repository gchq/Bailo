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
  user: string
  kind: ResponseKindKeys
  role?: string
  decision?: DecisionKeys
  comment?: string

  createdAt: string
  updatedAt: string
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ResponseDoc = ResponseInterface & Document<any, any, ResponseInterface>

const ResponseSchema = new Schema<ResponseInterface>(
  {
    user: { type: String, required: true },
    kind: { type: String, enum: Object.values(ResponseKind) },
    role: { type: String },
    decision: { type: String, enum: Object.values(Decision) },
    comment: { type: String, required: true },
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
