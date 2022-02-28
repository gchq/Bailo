import { withTheme } from '@rjsf/core'

import { Theme as MaterialUITheme } from '../MuiForms'
import UserSelector from '../MuiForms/UserSelector'
import Nothing from '../MuiForms/Nothing'

import { Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'

const SchemaForm = withTheme(MaterialUITheme)

export default function RenderForm(step: Step, steps: Array<Step>, setSteps: Function) {
  console.log(steps)
  console.log(step.schemaRef)
  console.log(steps[0].schemaRef)
  const onFormChange = (form) => {
    setStepState(steps, setSteps, step, { ...step.state, ...form.formData })
  }

  return (
    <SchemaForm
      schema={step.schema}
      formData={step.state}
      onChange={onFormChange}
      widgets={{
        userSelector: UserSelector,
        nothing: Nothing,
      }}
      uiSchema={step.uiSchema}
      liveValidate={step.shouldValidate}
    >
      <></>
    </SchemaForm>
  )
}
