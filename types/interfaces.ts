import Logger from 'bunyan'
import { Date, Types } from 'mongoose'
import { Dispatch, SetStateAction } from 'react'
import { UserDoc } from '../server/models/User'
import { VersionDoc } from '../server/models/Version'

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

export interface DeploymentMetadata {
  highLevelDetails: {
    name: string

    [x: string]: unknown
  }

  contacts: {
    owner: Array<Entity>

    [x: string]: unknown
  }
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
    uploader: Array<Entity>
    reviewer: Array<Entity>
    manager: Array<Entity>

    [x: string]: any
  }

  buildOptions?: {
    uploadType: ModelUploadType
    seldonVersion: string

    [x: string]: any
  }

  // allow other properties
  [x: string]: any
}

export interface Model {
  schemaRef: string
  uuid: string

  versions: Array<Types.ObjectId>

  latestVersion: VersionDoc | Types.ObjectId
}

export interface LogStatement {
  timestamp: Date
  level: string
  msg: string
}

export enum SchemaTypes {
  UPLOAD = 'UPLOAD',
  DEPLOYMENT = 'DEPLOYMENT',
}

export type SchemaType = SchemaTypes.UPLOAD | SchemaTypes.DEPLOYMENT

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

  development: {
    logUrl: string
  }

  seldonVersions: Array<SeldonVersion>
}

export type SeldonVersion = {
  name: string
  image: string
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

export enum EntityKind {
  USER = 'user',
}

export interface Entity {
  kind: EntityKind
  id: string
}

export interface ParsedEntity {
  kind: EntityKind
  entity: UserDoc
}

export enum LogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
}

export enum LogLevelLabel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  _id: string
  name: string
  hostname: string
  pid: number

  level: LogLevel

  msg: string

  time: string

  src?: {
    file: string
    line: number
  }

  [x: string]: unknown
}

export enum LogType {
  Build = 'build',
  Approval = 'approval',
  Misc = 'misc',
}

export type SchemaQuestion = {
  reference: string
  title: string
  description: string
  type: string
  format?: string
  minLength?: number
  maxLength?: number
  widget?: string
  readOnly?: boolean
}

export interface MinimalEntry {
  compressedSize: number
  generalPurposeBitFlag: number
  compressionMethod: number
  relativeOffsetOfLocalHeader: number
  uncompressedSize: number
  fileName: string
}
