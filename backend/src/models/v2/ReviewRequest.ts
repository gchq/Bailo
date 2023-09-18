import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { ReviewKind, ReviewKindKeys } from '../../types/v2/enums.js'

export const Decision = {
  RequestChanges: 'request_changes',
  Approve: 'approve',
} as const
export type DecisionKeys = (typeof Decision)[keyof typeof Decision]

interface Review {
  user: string
  decision: DecisionKeys
  comment: string
}

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ReviewRequestInterface {
  semver?: string
  modelId?: string
  kind: ReviewKindKeys

  role: string

  reviews: Array<Review>

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ReviewRequestDoc = ReviewRequestInterface & Document<any, any, ReviewRequestInterface>

const ReviewRequestSchema = new Schema<ReviewRequestInterface>(
  {
    semver: {
      type: String,
      required: function (this: ReviewRequestInterface): boolean {
        return this.kind === ReviewKind.Release
      },
    },
    modelId: { type: String, required: true },
    kind: { type: String, enum: Object.values(ReviewKind), required: true },

    role: { type: String, required: true },

    reviews: [
      {
        user: { type: String, required: true },
        decision: { type: String, enum: Object.values(Decision), required: true },
        comment: { type: String, required: false },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'v2_review_requests',
  }
)

ReviewRequestSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: String,
})

const ReviewRequestModel = model<ReviewRequestInterface>('v2_Review_Request', ReviewRequestSchema)

export default ReviewRequestModel
