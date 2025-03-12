import { model, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

export interface InferenceSetting {
  processorType: string
  memory?: number
  port: number
}

export interface InferenceInterface {
  modelId: string
  image: string
  tag: string

  description: string

  settings: InferenceSetting

  deleted: boolean

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export type InferenceDoc = InferenceInterface & SoftDeleteDocument

const InferenceSchema = new Schema<InferenceDoc>(
  {
    modelId: { type: String, required: true },
    image: { type: String, required: true },
    tag: { type: String, required: true },

    description: { type: String, required: false, default: '' },

    settings: {
      processorType: { type: String, required: true },
      memory: {
        type: Number,
        required: function (this: InferenceInterface): boolean {
          return this.settings.processorType === 'cpu'
        },
        validate: function (this: InferenceInterface, val: any): boolean {
          if (this.settings.processorType === 'cpu' && val) {
            return true
          }
          throw new Error(`Cannot specify memory allocation without choosing cpu as the processor type`)
        },
      },
      port: { type: Number, required: true },
    },

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_model_inferences',
  },
)

InferenceSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: String,
  deletedAt: true,
})

InferenceSchema.index({ modelId: 1, image: 1, tag: 1 }, { unique: true })

const InferenceModel = model<InferenceDoc>('v2_Model_Inference', InferenceSchema)

export default InferenceModel
