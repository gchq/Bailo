import { model, ObjectId, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

import { ScanState, ScanStateKeys } from '../connectors/fileScanning/Base.js'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ScanInterface {
  _id: ObjectId

  // file or image
  artefactType: ArtefactTypeKeys
  // for files
  fileId?: string
  // for images
  // map this to registry GET /v2/<name>/manifests/<reference>
  repositoryName?: string
  imageDigest?: string

  toolName: string
  scannerVersion?: string
  state: ScanStateKeys
  isInfected?: boolean
  viruses?: string[]
  lastRunAt: Date

  createdAt: Date
  updatedAt: Date
}

export const ArtefactType = {
  File: 'file',
  Image: 'image',
} as const
export type ArtefactTypeKeys = (typeof ArtefactType)[keyof typeof ArtefactType]

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ScanInterfaceDoc = ScanInterface & SoftDeleteDocument

const ScanSchema = new Schema<ScanInterfaceDoc>(
  {
    artefactType: { type: String, enum: Object.values(ArtefactType), required: true },
    fileId: {
      type: String,
      required: function (): boolean {
        return this['artefactType'] === ArtefactType.File
      },
      validate: function (val: any): boolean {
        if (this['artefactType'] === ArtefactType.File && val) {
          return true
        }
        throw new Error(`Cannot provide a 'fileId' with '${JSON.stringify({ artefactType: this['artefactType'] })}'`)
      },
    },
    imageDigest: {
      type: String,
      required: function (): boolean {
        return this['artefactType'] === ArtefactType.Image
      },
      validate: function (val: any): boolean {
        if (this['artefactType'] === ArtefactType.Image && val) {
          return true
        }
        throw new Error(
          `Cannot provide an 'imageDigest' with '${JSON.stringify({ artefactType: this['artefactType'] })}'`,
        )
      },
    },
    repositoryName: {
      type: String,
      required: function (): boolean {
        return this['artefactType'] === ArtefactType.Image
      },
      validate: function (val: any): boolean {
        if (this['artefactType'] === ArtefactType.Image && val) {
          return true
        }
        throw new Error(
          `Cannot provide a 'repositoryName' with '${JSON.stringify({ artefactType: this['artefactType'] })}'`,
        )
      },
    },

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
