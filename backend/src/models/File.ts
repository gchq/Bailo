import { model, ObjectId, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

import { ScanInterface } from './Scan.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface FileInterface {
  _id: ObjectId
  modelId: string

  name: string
  size: number
  mime: string

  bucket: string
  path: string

  complete: boolean

  tags?: string[]

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type FileInterfaceDoc = FileInterface & SoftDeleteDocument
// `id` is used by the python API so we need to keep this to prevent a breaking change
export type FileWithScanResultsInterface = FileInterface & { avScan: ScanInterface[]; id: string }

const FileSchema = new Schema<FileInterfaceDoc>(
  {
    modelId: { type: String, required: true },

    name: { type: String, required: true },
    size: { type: Number },
    mime: { type: String, required: true },

    bucket: { type: String, required: true },
    path: { type: String, required: true },

    tags: [{ type: String }],

    complete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'v2_files',
    toJSON: { getters: true },
  },
)

FileSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
  deletedAt: true,
})

const FileModel = model<FileInterfaceDoc>('v2_File', FileSchema)

export default FileModel
