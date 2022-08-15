import { Date, Types } from 'mongoose'
import Logger from 'bunyan'
import { UserDoc } from '../server/models/User'

export type { VersionDoc as Version } from '../server/models/Version'
export type { DeploymentDoc as Deployment } from '../server/models/Deployment'
export type { RequestDoc as Request } from '../server/models/Request'
export type { UserDoc as User } from '../server/models/User'

export type { ApprovalStates } from '../server/models/Deployment'

declare global {
  namespace Express {
    interface Request {
      user: UserDoc

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

export type SchemaType = 'UPLOAD' | 'DEPLOYMENT'

export interface Schema {
  name: string
  reference: string
  schema: any
  use: SchemaType
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

  uploadWarning: {
    showWarning: boolean
    checkboxText: string
  }

  deploymentWarning: {
    showWarning: boolean
    checkboxText: string
  }
}

export type RequestType = 'Upload' | 'Deployment'

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

export type ModelId = string | Types.ObjectId

export interface BuildOptions {
  rawModelExport: boolean
  allowGuestDeployments: boolean
}
