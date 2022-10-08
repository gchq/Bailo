import { Types, HydratedDocument } from 'mongoose'
import { ApprovalStates, DateString, LogStatement } from '../interfaces'
import { Modify } from '../utils'

export interface Version {
  model: Types.ObjectId
  version: string

  metadata: any
  state: any

  managerApproved: ApprovalStates
  managerLastViewed: Date
  reviewerApproved: ApprovalStates
  reviewerLastViewed: Date

  built: boolean
  logs: Array<LogStatement>
  files: {
    rawBinaryPath: string
    rawCodePath: string
  }

  createdAt: Date
  updatedAt: Date
}

export interface VersionMethods {
  log: (level: string, msg: string) => Promise<void>
}

export type VersionDoc = HydratedDocument<Version, VersionMethods>

export type VersionClient = Modify<
  Version,
  {
    model: string

    managerLastViewed: DateString
    reviewerLastViewed: DateString

    createdAt: DateString
    updatedAt: DateString
  }
>
