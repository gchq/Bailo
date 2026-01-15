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

import { FormStats, ModelFormStats, SplitSchemaNoRender, StepNoRender, StepType } from '../types/types'
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

function isMetricsKey(key: string): boolean {
  return key.toLowerCase().includes('metrics')
}

function isAnswered(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

function isRequiredArray(schema: any): boolean {
  return schema?.type === 'array' && typeof schema.minItems === 'number' && schema.minItems >= 1
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function isPrimitiveSchema(schema: any): boolean {
  if (!schema || typeof schema !== 'object') return false
  if ('$ref' in schema) return true
  return ['string', 'number', 'boolean'].includes(schema.type)
}

/**
 * Counts how many questions are defined in a schema.
 */
function countQuestionsFromSchema(schema: any): number {
  if (!schema || typeof schema !== 'object') return 0

  if (isPrimitiveSchema(schema)) {
    return 1
  }

  // If array - Only count if needed
  if (schema.type === 'array' && schema.items) {
    if (!isRequiredArray(schema)) return 0
    return countQuestionsFromSchema(schema.items)
  }

  if (schema.type === 'object' && schema.properties) {
    let total = 0
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (isMetricsKey(key)) continue
      total += countQuestionsFromSchema(prop)
    }
    return total
  }

  return 0
}

/**
 * Counts how many questions defined in a schema have been answered.
 */
function countAnswersFromSchemaAndState(schema: any, state: any): number {
  if (!schema || typeof schema !== 'object') return 0

  if (isPrimitiveSchema(schema)) {
    return isAnswered(state) ? 1 : 0
  }

  // If Array - Check first item
  if (schema.type === 'array' && schema.items) {
    if (!Array.isArray(state) || state.length === 0) return 0
    return countAnswersFromSchemaAndState(schema.items, state[0])
  }

  if (schema.type === 'object' && schema.properties) {
    let total = 0
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (isMetricsKey(key)) continue
      total += countAnswersFromSchemaAndState(prop, state?.[key])
    }
    return total
  }

  return 0
}

/**
 * Calculates completion statistics for a single form step.
 *
 * Determines the total number of questions and answered questions based on
 * the provided uiSchema and form state, and returns a percentage completion
 * rounded to one decimal place.
 *
 * If no step is provided, all numeric values are returned as -1 and the form
 * is marked as incomplete.
 */
export function getFormStats(step?: StepNoRender): FormStats {
  if (!step) {
    return {
      totalQuestions: -1,
      totalAnswers: -1,
      percentageQuestionsComplete: -1,
      formCompleted: false,
    }
  }

  const totalQuestions = countQuestionsFromSchema(step.schema)
  const totalAnswers = countAnswersFromSchemaAndState(step.schema, step.state)

  // If more answers given than required answers then return 100% otherwise calulate percentage
  const percentageQuestionsComplete =
    totalQuestions === 0 ? 0 : Math.min(100, roundToOneDecimal((totalAnswers / totalQuestions) * 100))

  return {
    totalQuestions,
    totalAnswers,
    percentageQuestionsComplete,
    formCompleted: totalAnswers >= totalQuestions,
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
    if (stepStats.formCompleted) pagesCompleted += 1
  })

  return {
    totalQuestions,
    totalAnswers,
    percentageQuestionsComplete: (totalAnswers / totalQuestions) * 100,
    percentagePagesComplete: (pagesCompleted / totalPages) * 100,
    formCompleted: totalAnswers >= totalQuestions,
    totalPages,
    pagesCompleted,
  }
}
