import { model, ObjectId, Schema } from 'mongoose'

import { ArtefactScanState, ArtefactScanStateKeys } from '../connectors/artefactScanning/Base.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export type ScanInterface = {
  _id: ObjectId

  toolName: string
  scannerVersion?: string
  state: ArtefactScanStateKeys
  vulnerabilities?: ArtefactVulnerability[]
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

export const SeverityLevel = {
  UNSPECIFIED: 'unspecified',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const
export type SeverityLevelKeys = (typeof SeverityLevel)[keyof typeof SeverityLevel]

export type ArtefactVulnerability = {
  severity: SeverityLevelKeys
  vulnerabilityDescription: string
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
    vulnerabilities: [
      {
        severity: { type: String, enum: Object.values(SeverityLevel) },
        vulnerabilityDescription: { type: String },
      },
    ],
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
