import { HydratedDocument, model, Schema } from 'mongoose'

import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export interface DeploymentAssessmentMetadata {
  overview?: {
    riskOwner?: string
    justification?: string
    modelIds?: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface DeploymentAssessmentInterface {
  id: string
  name: string
  schemaId: string
  metadata: DeploymentAssessmentMetadata
  draft: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export const DeploymentAssessmentState = {
  NeedsReview: 'needs_review',
  Rejected: 'rejected',
  ChangesRequested: 'changes_requested',
  Approved: 'approved',
} as const
export type DeploymentAssessmentStateKeys = (typeof DeploymentAssessmentState)[keyof typeof DeploymentAssessmentState]

export type DeploymentAssessmentDoc = HydratedDocument<DeploymentAssessmentInterface> & SoftDeleteDocument

const DeploymentAssessmentSchema = new Schema<DeploymentAssessmentDoc>(
  {
    id: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    schemaId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    draft: { type: Boolean, required: true, default: true },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v3_deployment_assessments',
  },
)

DeploymentAssessmentSchema.plugin(softDeletionPlugin)
DeploymentAssessmentSchema.index({ 'metadata.overview.modelIds': 1 })
DeploymentAssessmentSchema.index({ 'metadata.overview.riskOwner': 1 })
DeploymentAssessmentSchema.index({ createdBy: 1 })

const DeploymentAssessmentModel = model<DeploymentAssessmentDoc>('v3_Deployment_Assessment', DeploymentAssessmentSchema)

export default DeploymentAssessmentModel
