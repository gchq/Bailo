import { UiSchema } from '@rjsf/utils'
import { Dispatch, SetStateAction } from 'react'
import { ReviewComment } from 'types/types'
import { ModelInterface } from 'types/v2/types'

export interface SplitSchema {
  reference: string

  steps: Array<Step>
}

export interface SplitSchemaNoRender {
  reference: string

  steps: Array<StepNoRender>
}

export interface RenderInterface {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
}

export type StepType = 'Form' | 'Data' | 'Message'

export interface Step {
  schema: any
  uiSchema?: UiSchema

  state: any
  index: number

  steps?: Array<Step>

  type: StepType
  section: string
  schemaRef: string

  render: (RenderInterface) => JSX.Element | null
  renderBasic: (RenderInterface) => JSX.Element | null
  renderButtons: (RenderButtonsInterface) => JSX.Element | null

  shouldValidate: boolean
  isComplete: (step: Step) => boolean
}

export interface StepNoRender {
  schema: any
  uiSchema?: UiSchema

  state: any
  index: number

  steps?: Array<StepNoRender>

  type: StepType
  section: string
  schemaRef: string

  shouldValidate: boolean
  isComplete: (step: StepNoRender) => boolean
}

export interface TeamInterface {
  id: string

  name: string
  description: string

  deleted: boolean

  createdAt: Date
  updatedAt: Date
}

export const ModelVisibility = {
  Private: 'private',
  Public: 'public',
} as const

export type ModelVisibilityKeys = (typeof ModelVisibility)[keyof typeof ModelVisibility]

export const Decision = {
  RequestChanges: 'request_changes',
  Approve: 'approve',
} as const
export type DecisionKeys = (typeof Decision)[keyof typeof Decision]

export interface ReviewResponse {
  user: string
  decision: DecisionKeys
  comment?: string
  createdAt: string
  updatedAt: string
}

type PartialReviewRequestInterface =
  | {
      accessRequestId: string
      semver?: never
    }
  | {
      accessRequestId?: never
      semver: string
    }

export type ReviewRequestInterface = {
  model: ModelInterface
  role: string
  kind: 'release' | 'access'
  responses: ReviewResponse[]
  createdAt: string
  updatedAt: string
} & PartialReviewRequestInterface

export interface AccessRequestMetadata {
  overview: {
    name: string
    entities: Array<string>
    endDate?: string
    [x: string]: unknown
  }
  [x: string]: unknown
}

export interface AccessRequestInterface {
  id: string
  modelId: string
  schemaId: string
  deleted: boolean
  metadata: AccessRequestMetadata
  comments: Array<ReviewComment>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ModelImage {
  repository: string
  name: string
  tags: Array<string>
}

export interface FlattenedModelImage {
  repository: string
  name: string
  tag: string
}

export interface FileWithMetadata {
  fileName: string
  metadata?: string
}

export interface ReviewResponseWithRole extends ReviewResponse {
  role: string
}
