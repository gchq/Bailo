import { HydratedDocument, model, Schema, Types } from 'mongoose'

import { ReviewKind } from '../types/enums.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export type ReviewInterface =
  | ({
      kind: 'access'
      modelId: string
      dueDate?: undefined
      semver?: undefined
      accessRequestId: string
    } & PartialReviewInterface)
  | ({
      kind: 'release'
      modelId: string
      dueDate?: undefined
      semver: string
      accessRequestId: undefined
    } & PartialReviewInterface)
  | ({
      kind: 'lifecycle'
      modelId: string
      dueDate: Date
      semver?: undefined
      accessRequestId?: undefined
    } & PartialReviewInterface)
  | ({
      kind: 'deployment_assessment'
      deploymentAssessmentId: string
      modelId?: undefined
      dueDate?: undefined
      semver?: undefined
      accessRequestId?: undefined
    } & PartialReviewInterface)

type PartialReviewInterface = {
  _id: Types.ObjectId
  role: string
  createdAt: string
  updatedAt: string
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ReviewDoc = HydratedDocument<ReviewInterface> & SoftDeleteDocument

const ReviewSchema = new Schema<ReviewDoc>(
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
    deploymentAssessmentId: {
      type: String,
      required: function (this: ReviewInterface): boolean {
        return this.kind === ReviewKind.DeploymentAssessment
      },
    },
    modelId: {
      type: String,
      required: function (this: ReviewInterface): boolean {
        return this.kind !== ReviewKind.DeploymentAssessment
      },
    },
    kind: { type: String, enum: Object.values(ReviewKind), required: true },
    dueDate: {
      type: Schema.Types.Date,
      required: function (this: ReviewInterface): boolean {
        return this.kind === ReviewKind.Lifecycle
      },
    },
    role: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_reviews',
  },
)

ReviewSchema.plugin(softDeletionPlugin)
ReviewSchema.index({ deploymentAssessmentId: 1, kind: 1, createdAt: -1 })

const ReviewModel = model<ReviewDoc>('v2_Review', ReviewSchema)

export default ReviewModel
