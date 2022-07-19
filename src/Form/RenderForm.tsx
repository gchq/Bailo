import { withTheme } from '@rjsf/core'

import { Theme as MaterialUITheme } from '../MuiForms'
import UserSelector from '../MuiForms/UserSelector'
import Nothing from '../MuiForms/Nothing'
import TextareaWidget from '../MuiForms/TextareaWidget'

import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'

const SchemaForm = withTheme(MaterialUITheme)

export default function RenderForm({
  currentStep: step,
  splitSchema,
  setSplitSchema,
}: {
  currentStep: Step
  splitSchema: SplitSchema
  setSplitSchema: Function
}) {
  const onFormChange = (form) => {
    if (form.schema.title !== step.schema.title) {
      return
    }
    setStepState(splitSchema, setSplitSchema, step, { ...step.state, ...form.formData })
  }

  return (
    <SchemaForm
      schema={step.schema}
      formData={step.state}
      onChange={onFormChange}
      widgets={{
        userSelector: UserSelector,
        textArea: TextareaWidget,
        nothing: Nothing,
      }}
      uiSchema={step.uiSchema}
      liveValidate={step.shouldValidate}
      omitExtraData
      liveOmit
    >
      <></>
    </SchemaForm>
  )
}
