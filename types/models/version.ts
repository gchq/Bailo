import { Types, HydratedDocument } from 'mongoose'
import { ModelDoc } from '../../server/models/Model'
import { ApprovalStates, DateString, LogStatement } from '../interfaces'
import { Modify } from '../utils'

export interface Version {
  _id: Types.ObjectId

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
    rawBinaryPath?: string
    rawCodePath?: string
    rawDockerPath?: string
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
    _id: string
    model: string

    managerLastViewed: DateString
    reviewerLastViewed: DateString

    createdAt: DateString
    updatedAt: DateString
  }
>

export type VersionWithModel = Modify<
  VersionDoc,
  {
    model: ModelDoc
  }
>

export type GetVersion = {
  logs: Array<LogStatement> | undefined
}

export type GetVersionServer = Modify<Version, GetVersion>
export type GetVersionClient = Modify<VersionClient, GetVersion>
