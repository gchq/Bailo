import { Dispatch, SetStateAction } from 'react'

export interface SplitSchema {
  reference: string

  steps: Array<Step>
}

export interface RenderInterface {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
}

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
