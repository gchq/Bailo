import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

import { ReviewKind, ReviewKindKeys } from '../types/enums.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ReviewInterface {
  semver?: string
  accessRequestId?: string
  modelId: string

  kind: ReviewKindKeys
  role: string

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ReviewDoc = ReviewInterface & Document<any, any, ReviewInterface>

const ReviewSchema = new Schema<ReviewInterface>(
  {
    semver: {
      type: String,
      required: function (this: ReviewInterface): boolean {
        return this.kind === ReviewKind.Release
      },
      validate: function (this: ReviewInterface, val: any): boolean {
        if (this.kind === ReviewKind.Release && val) {
          return true
        }
        throw new Error(`Cannot provide a 'semver' with '${JSON.stringify({ kind: this.kind })}'`)
      },
    },
    accessRequestId: {
      type: String,
      required: function (this: ReviewInterface): boolean {
        return this.kind === ReviewKind.Access
      },
      validate: function (this: ReviewInterface, val: any): boolean {
        if (this.kind === ReviewKind.Access && val) {
          return true
        }
        throw new Error(`Cannot provide an 'accessRequestId' with '${JSON.stringify({ kind: this.kind })}'`)
      },
    },
    modelId: { type: String, required: true },
    kind: { type: String, enum: Object.values(ReviewKind), required: true },

    role: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_reviews',
  },
)

ReviewSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: String,
  deletedAt: true,
})

const ReviewModel = model<ReviewInterface>('v2_Review', ReviewSchema)

export default ReviewModel
