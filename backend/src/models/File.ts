import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface FileInterface {
  modelId: string

  name: string
  size: number
  mime: string

  bucket: string
  path: string

  complete: boolean

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type FileInterfaceDoc = FileInterface & Document<any, any, FileInterface>

const FileSchema = new Schema<FileInterface>(
  {
    modelId: { type: String, required: true },

    name: { type: String, required: true },
    size: { type: Number, required: true },
    mime: { type: String, required: true },

    bucket: { type: String, required: true },
    path: { type: String, required: true },

    complete: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_files',
    toJSON: { getters: true },
  },
)

FileSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const FileModel = model<FileInterface>('v2_File', FileSchema)

export default FileModel
