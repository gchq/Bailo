import { Date, Document, Types } from 'mongoose'
import Logger from 'bunyan'

declare global {
  namespace Express {
    interface Request {
      user?: User

      reqId: string
      log: Logger
    }

    interface Response {
      error: Function
    }
  }
}

export interface StatusError extends Error {
  data: any
  code: number
}

export interface ModelMetadata {
  highLevelDetails: {
    tags: Array<string>
    name: string
    modelInASentence: string
    modelOverview: string
    modelCardVersion: string

    [x: string]: any
  }

  contacts: {
    uploader: string
    reviewer: string
    manager: string

    [x: string]: any
  }

  // allow other properties
  [x: string]: any
}

export interface Model {
  schemaRef: string
  uuid: string

  parent: Types.ObjectId
  versions: Array<Types.ObjectId>

  currentMetadata: ModelMetadata

  owner: Types.ObjectId
}

export interface LogStatement {
  timestamp: Date
  level: string
  msg: string
}

export type ApprovalStatus = 'Accepted' | 'Declined' | 'No Response'

export interface Version extends Document {
  _id: Types.ObjectId
  model: Model
  version: string

  metadata: ModelMetadata

  built: boolean
  managerApproved: ApprovalStatus
  reviewerApproved: ApprovalStatus

  state: any
  logs: Array<LogStatement>
}

export type SchemaType = 'UPLOAD' | 'DEPLOYMENT'

export interface Schema {
  name: string
  reference: string
  schema: any
  use: SchemaType
}

export interface Deployment extends Document {
  _id: Types.ObjectId

  schemaRef: string
  uuid: string

  model: Model
  metadata: any

  managerApproved: ApprovalStatus

  logs: Array<LogStatement>
  built: boolean

  owner: User

  createdAt: Date
  updatedAt: Date
}

export interface UiConfig {
  banner: {
    enable: boolean
    text: string
    colour: string
  }

  issues: {
    label: string
    supportHref: string
    contactHref: string
  }

  help: {
    documentationUrl: string
  }

  registry: {
    host: string
  }
}

export interface User {
  _id: Types.ObjectId
  id: string
  roles: Array<string>
  favourites: Array<Types.ObjectId>
  token: string
  email?: string

  save: Function
  toObject: Function
}

export type RequestStatusType = 'Accepted' | 'Declined' | 'No Response'
export type RequestApprovalType = 'Manager' | 'Reviewer'
export type RequestType = 'Upload' | 'Deployment'
export interface Request extends Document {
  _id: Types.ObjectId

  version: Version
  deployment: Deployment

  user: Types.ObjectId

  status: RequestStatusType

  approvalType: RequestApprovalType
  request: RequestType
}

export type StepType = 'Form' | 'Data' | 'Message'
export interface Step {
  schema: any
  uiSchema?: any

  state: any
  index: number

  type: StepType
  section: string
  schemaRef: string

  render: Function
  renderBasic: Function
  renderButtons: Function

  shouldValidate: boolean
  isComplete: Function
}

export interface SplitSchema {
  reference: string

  steps: Array<Step>
}