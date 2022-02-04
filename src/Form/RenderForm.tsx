import { withTheme } from '@rjsf/core'

import { Step } from '../../types/interfaces'
import UserSelector from '../MuiForms/UserSelector'
import { Theme as MaterialUITheme } from '../MuiForms'
import { setStepState } from '../../utils/formUtils'

const SchemaForm = withTheme(MaterialUITheme)

export default function RenderForm(step: Step, steps: Array<Step>, setSteps: Function) {
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
      }}
      uiSchema={step.uiSchema}
    >
      <></>
    </SchemaForm>
  )
}
