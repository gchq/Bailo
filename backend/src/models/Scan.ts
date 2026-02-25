import { model, type ObjectId, Schema } from 'mongoose'

import type { ModelScanResponse, TrivyScanResultResponse } from '../clients/artefactScan.js'
import { ArtefactScanState, type ArtefactScanStateKeys } from '../connectors/artefactScanning/Base.js'
import { type SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export type ScanInterface = {
  _id: ObjectId

  toolName: string
  scannerVersion?: string
  state: ArtefactScanStateKeys
  summary?: ScanSummary
  additionalInfo?: TrivyScanResultResponse | ModelScanResponse

  lastRunAt: Date

  createdAt: Date
  updatedAt: Date
} & (
  | {
      artefactKind: typeof ArtefactKind.FILE
      fileId: string
    }
  | {
      artefactKind: typeof ArtefactKind.IMAGE
      layerDigest: string
    }
)

export type ScanSummary = (ArtefactScanSummary | ClamAVSummary)[]

export type ArtefactScanSummary = {
  severity: SeverityLevelKeys
  vulnerabilityDescription: string
}

export type ClamAVSummary = {
  virus: string
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
  FILE: 'file',
  IMAGE: 'image',
} as const
export type ArtefactKindKeys = (typeof ArtefactKind)[keyof typeof ArtefactKind]

export type ScanInterfaceDoc = ScanInterface & SoftDeleteDocument

const ScanSchema = new Schema<ScanInterfaceDoc>(
  {
    artefactKind: { type: String, enum: Object.values(ArtefactKind), required: true },
    fileId: { type: String },
    layerDigest: { type: String },

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
