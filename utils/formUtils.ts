import omit from 'lodash/omit'
import get from 'lodash/get'
import dropRight from 'lodash/dropRight'
import remove from 'lodash/remove'
import { Validator } from 'jsonschema'

import { Step, StepType } from '../types/interfaces'
import RenderForm from '../src/Form/RenderForm'
import RenderButtons from '../src/Form/RenderButtons'

export function createStep({
  schema,
  uiSchema,
  state,
  type,
  section,
  render,
  renderBasic,
  renderButtons = RenderButtons,
  index,
  schemaRef,
  isComplete,
}: {
  schema: any
  uiSchema?: any
  state: any
  type: StepType
  section: string
  render: Function
  renderBasic?: Function
  renderButtons?: Function
  index: number
  schemaRef: string
  isComplete: Function
}): Step {
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
    render,
    renderBasic: renderBasic ?? render,
    renderButtons,
  }
}

export function setStepState(steps: Array<Step>, setSteps: Function, step: Step, state: any) {
  const index = steps.findIndex((iStep) => step.section === iStep.section)

  const duplicatedSteps = [...steps]
  duplicatedSteps[index].state = {
    ...(steps[index].state || {}),
    ...state,
  }

  setSteps(duplicatedSteps)
}

export function setStepValidate(steps: Array<Step>, setSteps: Function, step: Step, validate: boolean) {
  const index = steps.findIndex((iStep) => step.section === iStep.section)

  const duplicatedSteps = [...steps]
  duplicatedSteps[index].shouldValidate = validate
  setSteps(duplicatedSteps)
}

export function getStepsFromSchema(
  schema: any,
  uiSchema: any,
  omitFields: Array<string> = [],
  state: any = {}
): Array<Step> {
  const schemaDupe = omit(schema, omitFields) as any

  for (let field of omitFields) {
    const fields = field.split('.')
    remove(get(schemaDupe, `${dropRight(fields, 2).join('.')}.required`, []), (v) => v === fields[fields.length - 1])
  }

  const props = Object.keys(schemaDupe.properties).filter((key) =>
    ['object', 'array'].includes(schemaDupe.properties[key].type)
  )

  const steps: Array<Step> = []
  props.forEach((prop: any, index: number) => {
    const createdStep = createStep({
      schema: {
        definitions: schemaDupe.definitions,
        ...schemaDupe.properties[prop],
      },
      uiSchema: {
        ...uiSchema[prop],
      },
      state: state[prop] || {},
      type: 'Form',
      index,
      schemaRef: schema.reference,

      section: prop,
      render: RenderForm,
      renderBasic: RenderForm,
      isComplete: validateForm,
    })

    steps.push(createdStep)
  })

  return steps
}

export function getStepsData(steps: Array<Step>, includeAll: boolean = false) {
  const data: any = {}

  steps.forEach((step) => {
    if (!includeAll && step.type !== 'Form') return

    data[step.section] = step.state
  })

  return data
}

export function setStepsData(steps: Array<Step>, setSteps: Function, data: any) {
  const newSteps = steps.map((step) => {
    if (!data[step.section]) return { ...step }
    if (step.type !== 'Form') return { ...step }

    return {
      ...step,
      state: data[step.section],
    }
  })

  setSteps(newSteps)
}

export function validateForm(step: Step) {
  const validator = new Validator()
  const sectionErrors = validator.validate(step.state, step.schema)

  return sectionErrors.errors.length === 0
}
