import Logger from 'bunyan'
import { Date, Types } from 'mongoose'
import { Dispatch, SetStateAction } from 'react'
import { VersionDoc } from '../../../server/models/Version'
import { UserDoc } from '../server/models/User'

export type { DeploymentDoc as Deployment } from '../server/models/Deployment'
export type { ApprovalDoc as Approval } from '../server/models/Approval'
export type { UserDoc as User } from '../server/models/User'
export type { VersionDoc as Version } from '../server/models/Version'

declare global {
  namespace Express {
    interface Request {
      user: UserDoc

      reqId: string
      log: Logger
    }

    interface Response {
      error: (code: number, error: any) => void
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

  buildOptions?: {
    uploadType: ModelUploadType
  }

  // allow other properties
  [x: string]: any
}

export interface Model {
  schemaRef: string
  uuid: string

  parent: Types.ObjectId | undefined
  versions: Array<Types.ObjectId>

  latestVersion: Types.ObjectId | VersionDoc

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

export type ApprovalCategory = 'Upload' | 'Deployment'

export type StepType = 'Form' | 'Data' | 'Message'
export interface Step {
  schema: any
  uiSchema?: any

  state: any
  index: number

  steps?: Array<Step>

  type: StepType
  section: string
  schemaRef: string

  render: (RenderInterface) => JSX.Element | null
  renderBasic?: (RenderInterface) => JSX.Element | null
  renderButtons: (RenderButtonsInterface) => JSX.Element | null

  shouldValidate: boolean
  isComplete: (step: Step) => boolean
}

export interface SplitSchema {
  reference: string

  steps: Array<Step>
}

export type ModelId = string | Types.ObjectId

export interface RenderInterface {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
}
export const approvalStateOptions = ['Accepted', 'Declined', 'No Response']

export enum ApprovalStates {
  Accepted = 'Accepted',
  Declined = 'Declined',
  NoResponse = 'No Response',
}

export type DocHeading = {
  title: string
  slug: string
  hasIndex: boolean
  children: DocFileOrHeading[]
  priority: number
}

export type DocFile = {
  title: string
  slug: string
  priority: number
}

export type DocFileOrHeading = DocHeading | DocFile

export type DocsMenuContent = DocFileOrHeading[]

export enum ModelUploadType {
  Zip = 'Code and binaries',
  ModelCard = 'Model card only',
  Docker = 'Prebuilt Docker image',
}

export enum UploadModes {
  NewModel = 'newModel',
  NewVersion = 'newVersion',
}

// Dates are in ISO 8601 format
enum DateStringBrand {}
export type DateString = string & DateStringBrand
