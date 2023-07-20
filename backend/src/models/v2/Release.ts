import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

export interface File {
  modelId: string
  name: string
  category: string
  size: number
  bucket: string
  path: string
}

export interface Image {
  modelId: string
  ref: string
  size: number
}

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ReleaseInterface {
  modelId: string
  modelCardId: string

  name: string
  semver: string
  notes: string

  minor: boolean
  draft: boolean

  files: Array<File>
  images: Array<Image>

  deleted: boolean

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ReleaseDoc = ReleaseInterface & Document<any, any, ReleaseInterface>

const ReleaseSchema = new Schema<ReleaseInterface>(
  {
    modelId: { type: String, required: true },
    modelCardId: { type: String, required: true },

    name: { type: String, required: true },
    semver: { type: String, required: true },
    notes: { type: String, required: true },

    minor: { type: Boolean, required: true },
    draft: { type: Boolean, required: true },

    files: [
      {
        modelId: { type: String, required: true },
        name: { type: String, required: true },
        category: { type: String, required: true },
        size: { type: Number, required: true },
        bucket: { type: String, required: true },
        path: { type: String, required: true },
      },
    ],
    images: [
      {
        modelId: { type: String, required: true },
        size: { type: Number, required: true },
        ref: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'v2_releases',
  }
)

ReleaseSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const ReleaseModel = model<ReleaseInterface>('v2_Release', ReleaseSchema)

export default ReleaseModel
