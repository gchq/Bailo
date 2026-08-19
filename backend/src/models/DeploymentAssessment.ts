import { HydratedDocument, model, Schema } from 'mongoose'

export interface DeploymentAssessmentMetadata {
  overview: {
    name: string
    riskOwner: string
    justification: string
    models: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface DeploymentAssessmentInterface {
  id: string
  schemaId: string
  metadata: DeploymentAssessmentMetadata
  draft: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type DeploymentAssessmentDoc = HydratedDocument<DeploymentAssessmentInterface>

const DeploymentAssessmentSchema = new Schema<DeploymentAssessmentDoc>(
  {
    id: { type: String, unique: true, required: true, index: true },
    schemaId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, required: true, default: {} },
    draft: { type: Boolean, required: true, default: false },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v3_deployment_assessments',
  },
)

DeploymentAssessmentSchema.index({ 'metadata.overview.models': 1 })
DeploymentAssessmentSchema.index({ 'metadata.overview.riskOwner': 1 })

const DeploymentAssessmentModel = model<DeploymentAssessmentDoc>('v3_Deployment_Assessment', DeploymentAssessmentSchema)

export default DeploymentAssessmentModel
