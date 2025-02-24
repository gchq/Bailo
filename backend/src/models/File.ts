import { model, ObjectId, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

import { FileScanResult, ScanState } from '../connectors/fileScanning/Base.js'

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

  avScan: Array<FileScanResult>

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type FileInterfaceDoc = FileInterface & SoftDeleteDocument

const FileSchema = new Schema<FileInterfaceDoc>(
  {
    modelId: { type: String, required: true },

    name: { type: String, required: true },
    size: { type: Number },
    mime: { type: String, required: true },

    bucket: { type: String, required: true },
    path: { type: String, required: true },

    avScan: {
      type: [
        {
          toolName: { type: String },
          scannerVersion: { type: String },
          state: { type: String, enum: Object.values(ScanState) },
          isInfected: { type: Boolean },
          viruses: [{ type: String }],
          lastRunAt: { type: Schema.Types.Date },
        },
      ],
      required: false,
      // prevent legacy field from being used
      validate: function (val: any): boolean {
        return val === undefined || val.length === 0
      },
    },

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
