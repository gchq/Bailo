import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ReleaseInterface {
  modelId: string
  modelCardVersion: number

  semver: string
  notes: string

  minor: boolean
  draft: boolean

  fileIds: Array<string>
  images: Array<ImageRef>

  deleted: boolean

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ImageRef {
  repository: string
  name: string
  tag: string
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ReleaseDoc = ReleaseInterface & Document<any, any, ReleaseInterface>

const ReleaseSchema = new Schema<ReleaseInterface>(
  {
    modelId: { type: String, required: true },
    modelCardVersion: { type: Number, required: true },

    semver: { type: String, required: true },
    notes: { type: String, required: true },

    minor: { type: Boolean, required: true },
    draft: { type: Boolean, required: true },

    fileIds: [{ type: Schema.Types.ObjectId }],
    images: [
      {
        repository: { type: String },
        name: { type: String },
        tag: { type: String },
      },
    ],

    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_releases',
  },
)

ReleaseSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })
ReleaseSchema.index({ modelId: 1, semver: 1 }, { unique: true })

const ReleaseModel = model<ReleaseInterface>('v2_Release', ReleaseSchema)

export default ReleaseModel
