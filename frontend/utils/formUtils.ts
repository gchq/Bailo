import { RegistryWidgetsType } from '@rjsf/utils'
import { Validator } from 'jsonschema'
import { cloneDeep, dropRight, get, omit, remove } from 'lodash-es'
import { Dispatch, SetStateAction } from 'react'
import CheckboxInput from 'src/MuiForms/CheckboxInput'
import CustomTextInput from 'src/MuiForms/CustomTextInput'
import DataCardSelector from 'src/MuiForms/DataCardSelector'
import DateSelector from 'src/MuiForms/DateSelector'
import Dropdown from 'src/MuiForms/Dropdown'
import EntitySelector from 'src/MuiForms/EntitySelector'
import Metrics from 'src/MuiForms/Metrics'
import MultipleDropdown from 'src/MuiForms/MultipleDropdown'
import Nothing from 'src/MuiForms/Nothing'
import RichTextInput from 'src/MuiForms/RichTextInput'
import TagSelector from 'src/MuiForms/TagSelector'

import { SplitSchemaNoRender, StepNoRender, StepType } from '../types/types'
import { createUiSchema } from './uiSchemaUtils'

export const widgets: RegistryWidgetsType = {
  TextWidget: CustomTextInput,
  CheckboxWidget: CheckboxInput,
  TextareaWidget: RichTextInput,
  DateWidget: DateSelector,
  tagSelector: TagSelector,
  entitySelector: EntitySelector,
  SelectWidget: Dropdown,
  multiSelector: MultipleDropdown,
  dataCardSelector: DataCardSelector,
  metricsWidget: Metrics,
  nothing: Nothing,
}

export function createStep({
  schema,
  uiSchema,
  state,
  type,
  section,
  index,
  schemaRef,
  isComplete,
}: {
  schema: any
  uiSchema?: any
  state: unknown
  type: StepType
  section: string
  index: number
  schemaRef: string
  isComplete: (step: StepNoRender) => boolean
}): StepNoRender {
  return {
    schema,
    uiSchema,
    state,
    type,
    index,

    section,
    schemaRef,

    shouldValidate: false,

    isComplete,
  }
}

export function setStepState(
  _splitSchema: SplitSchemaNoRender,
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>,
  step: StepNoRender,
  state: any,
) {
  setSplitSchema((oldSchema) => {
    const index = oldSchema.steps.findIndex((iStep) => step.section === iStep.section)

    const duplicatedSteps = [...oldSchema.steps]
    duplicatedSteps[index].state = {
      ...(oldSchema.steps[index].state || {}),
      ...state,
    }

    for (const duplicatedStep of duplicatedSteps) {
      duplicatedStep.steps = duplicatedSteps
    }

    return { ...oldSchema, steps: duplicatedSteps }
  })
}

export function setStepValidate(
  splitSchema: SplitSchemaNoRender,
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>,
  step: StepNoRender,
  validate: boolean,
) {
  const index = splitSchema.steps.findIndex((iStep) => step.section === iStep.section)

  const duplicatedSteps = [...splitSchema.steps]
  duplicatedSteps[index].shouldValidate = validate

  for (const duplicatedStep of duplicatedSteps) {
    duplicatedStep.steps = duplicatedSteps
  }

  setSplitSchema({ ...splitSchema, steps: duplicatedSteps })
}

export function getStepsFromSchema(
  schema: any,
  baseUiSchema: any = {},
  omitFields: Array<string> = [],
  state: any = {},
): Array<StepNoRender> {
  const schemaDupe = omit(schema.jsonSchema, omitFields) as any

  for (const field of omitFields) {
    const fields = field.split('.')
    remove(get(schemaDupe, `${dropRight(fields, 2).join('.')}.required`, []), (v) => v === fields[fields.length - 1])
  }

  const uiSchema = createUiSchema(schemaDupe, baseUiSchema)
  const props = Object.keys(schemaDupe.properties).filter((key) =>
    ['object', 'array'].includes(schemaDupe.properties[key].type),
  )

  const steps: Array<StepNoRender> = []
  props.forEach((prop: any, index: number) => {
    const createdStep = createStep({
      schema: {
        definitions: schemaDupe.definitions,
        ...schemaDupe.properties[prop],
      },
      uiSchema: uiSchema[prop],
      state: state[prop] || {},
      type: 'Form',
      index,
      schemaRef: schema.reference,

      section: prop,
      isComplete: validateForm,
    })

    steps.push(createdStep)
  })

  return steps
}

export function getStepsData(splitSchema: SplitSchemaNoRender, includeAll = false) {
  const data: any = {}

  splitSchema.steps.forEach((step) => {
    if (!includeAll && step.type !== 'Form') return

    data[step.section] = step.state
  })

  // Make sure not to return a weak reference to the underlying steps
  return cloneDeep(data)
}

export function setStepsData(
  splitSchema: SplitSchemaNoRender,
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>,
  data: any,
) {
  const newSteps = splitSchema.steps.map((step) => {
    if (!data[step.section]) return { ...step }
    if (step.type !== 'Form') return { ...step }

    return {
      ...step,
      state: data[step.section],
    }
  })

  for (const step of newSteps) {
    step.steps = newSteps
  }

  setSplitSchema({ ...splitSchema, steps: newSteps })
}

export function validateForm(step: StepNoRender) {
  const validator = new Validator()
  const sectionErrors = validator.validate(step.state, step.schema)

  return sectionErrors.errors.length === 0
}

export interface FormStats {
  totalQuestions: number
  totalAnswers: number
  percentageQuestionsComplete: number
  formCompleted: boolean
}

export interface ModelFormStats extends FormStats {
  totalPages: number
  pagesCompleted: number
  percentagePagesComplete: number
}

function countNestedObjects(state: any | undefined): number {
  if (state === null || state === undefined) {
    return -1
  }

  let total = 0

  for (const [sectionName, section] of Object.entries(state)) {
    if (section !== null && section !== undefined && typeof section === 'object') {
      // Ignore metrics as they are optional and may not be required
      if (sectionName !== 'metrics') {
        total += Object.keys(section).length
      }
    }

    if (section !== null && section !== undefined && typeof section !== 'object') {
      if (typeof section === 'string') {
        total += 1
      }
      if (Array.isArray(section) && section.length > 0) {
        total += 1
      }
    }
  }

  return total
}

export function getFormStats(step?: StepNoRender): FormStats {
  // console.log('getFormStats: ', step)
  // console.log(`getFormStats: ${JSON.stringify(step)}`)
  if (!step) {
    return {
      totalQuestions: -1,
      totalAnswers: -1,
      percentageQuestionsComplete: -1,
      formCompleted: false,
    }
  }
  const totalQuestions = countNestedObjects(step.uiSchema ?? {})
  const totalAnswers = countNestedObjects(step.state ?? {})
  const percentageQuestionsComplete = (totalAnswers / totalQuestions) * 100
  const formCompleted = totalQuestions === totalAnswers
  return {
    totalQuestions,
    totalAnswers,
    percentageQuestionsComplete,
    formCompleted,
  }
}

export function getOverallCompletionStats(steps: StepNoRender[]): ModelFormStats {
  let totalQuestions = 0
  let totalAnswers = 0
  let totalPages = 0
  let pagesCompleted = 0
  steps.forEach((step) => {
    const stepStats = getFormStats(step)
    totalQuestions += stepStats.totalQuestions
    totalAnswers += stepStats.totalAnswers
    totalPages += 1
    // if (totalQuestions === totalAnswers) {
    //   pagesCompleted += 1
    // }
    if (stepStats.formCompleted) {
      pagesCompleted += 1
    }
  })
  const percentageQuestionsComplete = (totalAnswers / totalQuestions) * 100
  const formCompleted = totalQuestions === totalAnswers
  const percentagePagesComplete = (pagesCompleted / totalPages) * 100

  return {
    totalQuestions,
    totalAnswers,
    percentageQuestionsComplete,
    percentagePagesComplete,
    formCompleted,
    totalPages,
    pagesCompleted,
  }
}

export function displayPercentage(percentage: number): string {
  return Number.isInteger(percentage) ? `${percentage}%` : `${percentage.toFixed(1)}%`
}
