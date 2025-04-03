import { model, ObjectId, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

import { ScanState, ScanStateKeys } from '../connectors/fileScanning/Base.js'

export type ScanInterface = {
  _id: ObjectId

  toolName: string
  scannerVersion?: string
  state: ScanStateKeys
  isInfected?: boolean
  viruses?: string[]
  lastRunAt: Date

  createdAt: Date
  updatedAt: Date
} & (
  | {
      artefactKind: typeof ArtefactKind.File
      fileId: string
    }
  | {
      artefactKind: typeof ArtefactKind.Image
      repositoryName: string
      // use Digest as image Tags can be overwritten but digests are immutable
      imageDigest: string
      // TODO: ultimately use backend/src/models/Release.ts:ImageRef, but ImageRef needs converting to use Digest rather than Tag first
    }
)

export const ArtefactKind = {
  File: 'file',
  Image: 'image',
} as const
export type ArtefactKindKeys = (typeof ArtefactKind)[keyof typeof ArtefactKind]

export type ScanInterfaceDoc = ScanInterface & SoftDeleteDocument

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
