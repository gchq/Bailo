import { model, ObjectId, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

import { FileScanResult, ScanState } from '../connectors/fileScanning/Base.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ScanInterface extends FileScanResult {
  _id: ObjectId

  createdAt: Date
  updatedAt: Date
}

export const ArtefactKind = {
  File: 'file',
  Image: 'image',
} as const
export type ArtefactKindKeys = (typeof ArtefactKind)[keyof typeof ArtefactKind]

export type ArtefactDetails =
  | {
      artefactKind: 'file'
      fileId: string
    }
  | {
      artefactKind: 'image'
      repositoryName: string
      // use Digest as image Tags can be overwritten but digests are immutable
      imageDigest: string
      // TODO: ultimately use backend/src/models/Release.ts:ImageRef, but ImageRef needs converting to use Digest rather than Tag first
    }

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ScanInterfaceDoc = ScanInterface & ArtefactDetails & SoftDeleteDocument

const ScanSchema = new Schema<ScanInterfaceDoc>(
  {
    artefactKind: { type: String, enum: Object.values(ArtefactKind), required: true },
    fileId: { type: String },
    repositoryName: { type: String },
    imageDigest: { type: String },

    toolName: { type: String, required: true },
    scannerVersion: { type: String },
    state: { type: String, enum: Object.values(ScanState), required: true },
    isInfected: { type: Boolean },
    viruses: [{ type: String }],
    lastRunAt: { type: Schema.Types.Date, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_scans',
    toJSON: { getters: true },
  },
)

ScanSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
  deletedAt: true,
})

const ScanModel = model<ScanInterfaceDoc>('v2_Scan', ScanSchema)

export default ScanModel
