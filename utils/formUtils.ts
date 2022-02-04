import { Step, StepType } from '../types/interfaces'
import RenderForm from '../src/Form/RenderForm'

export function createStep({
  schema,
  uiSchema,
  state,
  type,
  section,
  render,
  index,
  schemaRef,
}: {
  schema: any
  uiSchema?: any
  state: any
  type: StepType
  section: string
  render: Function
  index: number
  schemaRef: string
}) {
  const step: Step = {
    schema,
    uiSchema,
    state,
    type,
    index,

    section,
    schemaRef,

    render: (step: Step, steps: Array<Step>, setSteps: Function) => render(step, steps, setSteps),
  }

  return step
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

export function getStepsFromSchema(schema: any, uiSchema: any, state: any = {}): Array<Step> {
  const props = Object.keys(schema.properties).filter((key) =>
    ['object', 'array'].includes(schema.properties[key].type)
  )

  const steps: Array<Step> = []
  props.forEach((prop: any, index: number) => {
    const createdStep = createStep({
      schema: {
        definitions: schema.definitions,
        ...schema.properties[prop],
      },
      uiSchema: {
        ...uiSchema[prop]
      },
      state: state[prop] || {},
      type: 'Form',
      index,
      schemaRef: schema.reference,

      section: prop,
      render: (step: Step, steps: Array<Step>, setSteps: Function) => RenderForm(step, steps, setSteps),
    })

    steps.push(createdStep)
  })

  return steps
}

export function getStepsData(steps: Array<Step>) {
  const data: any = {}

  steps.forEach((step) => {
    if (step.type !== 'Form') return

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
