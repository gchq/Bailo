import { withTheme } from '@rjsf/core'
import { Dispatch, SetStateAction } from 'react'
import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'
import { Theme as MaterialUITheme } from '../MuiForms'
import Nothing from '../MuiForms/Nothing'
import TextareaWidget from '../MuiForms/TextareaWidget'
import UserSelector from '../MuiForms/UserSelector'

const SchemaForm = withTheme(MaterialUITheme)

export default function RenderForm({
  step,
  splitSchema,
  setSplitSchema,
}: {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
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
      {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
      <></>
    </SchemaForm>
  )
}
