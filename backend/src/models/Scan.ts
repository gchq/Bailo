import { model, ObjectId, Schema } from 'mongoose'

import { ArtefactScanState, ArtefactScanStateKeys } from '../connectors/artefactScanning/Base.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export type ScanInterface = {
  _id: ObjectId

  toolName: string
  scannerVersion?: string
  state: ArtefactScanStateKeys
  summary?: ScanSummary
  additionalInfo?: ScanAdditionalInfo

  lastRunAt: Date

  createdAt: Date
  updatedAt: Date
} & (
  | {
      artefactKind: typeof ArtefactKind.File
      fileId: string
    }
  | {
      //TODO - Change this - if necessary - when implementing image scanning.
      artefactKind: typeof ArtefactKind.Image
      repositoryName: string
      layerDigest: string
      packageList: string[]
    }
)

export type ScanSummary = (ModelScanSummary | ClamAVSummary)[]

export type ModelScanSummary = {
  severity: SeverityLevelKeys
  vulnerabilityDescription: string
}

export type ClamAVSummary = {
  virus: string
}

export type ScanAdditionalInfo = ModelScanAdditionalInfo[]

//TODO to be changed
export type ModelScanAdditionalInfo = {
  [x: string]: unknown
}

export const SeverityLevel = {
  UNKNOWN: 'unknown',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const
export type SeverityLevelKeys = (typeof SeverityLevel)[keyof typeof SeverityLevel]

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
    summary: [
      {
        type: Schema.Types.Mixed,
      },
    ],
    additionalInfo: [{ type: Schema.Types.Mixed }],
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
