import { Schema, model } from 'mongoose'

export const approvalStates = ['Accepted', 'Declined', 'No Response']
const RequestSchema = new Schema(
  {
    // ONE OF THESE TWO
    version: { type: Schema.Types.ObjectId, ref: 'Version' },
    deployment: { type: Schema.Types.ObjectId, ref: 'Deployment' },

    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, required: true, enum: approvalStates, default: 'No Response' },

    approvalType: { type: String, enum: ['Manager', 'Reviewer'] },
    request: { type: String, enum: ['Upload', 'Deployment'] },
  },
  {
    timestamps: true,
  }
)

const RequestModel = model('Request', RequestSchema)
export default RequestModel
