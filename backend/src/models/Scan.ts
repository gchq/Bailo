import { model, ObjectId, Schema } from 'mongoose'

import { ArtefactScanState, ArtefactScanStateKeys } from '../connectors/artefactScanning/Base.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export type ScanInterface = {
  _id: ObjectId

  toolName: string
  scannerVersion?: string
  state: ArtefactScanStateKeys
  isVulnerable?: boolean
  vulnerabilityTable?: ArtefactVulnerabilities
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
      layerDigest: string
      packageList: string[]
    }
)

export type ArtefactVulnerabilitiesDetails = {
  amount: number
  vulnerabilityDescriptions?: string[]
}

export type ArtefactVulnerabilities = {
  Unspecified: ArtefactVulnerabilitiesDetails
  Low: ArtefactVulnerabilitiesDetails
  Medium: ArtefactVulnerabilitiesDetails
  High: ArtefactVulnerabilitiesDetails
  Critical: ArtefactVulnerabilitiesDetails
}

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
    layerDigest: { type: String },
    packageList: [{ type: String }],

    toolName: { type: String, required: true },
    scannerVersion: { type: String },
    state: { type: String, enum: Object.values(ArtefactScanState), required: true },
    isVulnerable: { type: Boolean },
    vulnerabilityTable: { type: Schema.Types.Mixed },
    lastRunAt: { type: Schema.Types.Date, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_scans',
    toJSON: { getters: true },
  },
)

ScanSchema.plugin(softDeletionPlugin)

const ScanModel = model<ScanInterfaceDoc>('v2_Scan', ScanSchema)

export default ScanModel
