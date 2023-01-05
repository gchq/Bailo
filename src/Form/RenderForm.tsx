import { withTheme } from '@rjsf/core'
import { Dispatch, SetStateAction } from 'react'
import ModelVersionSelector from '@/src/MuiForms/ModelVersionSelector'
import EntitySelector from '@/src/MuiForms/EntitySelector'
import UserSelector from '@/src/MuiForms/UserSelector'
import SeldonVersionSelector from '@/src/MuiForms/SeldonVersionSelector'
import TextareaWidget from '@/src/MuiForms/TextareaWidget'
import Nothing from '@/src/MuiForms/Nothing'
import { Theme as MaterialUITheme } from '../MuiForms'
import { setStepState } from '../../utils/formUtils'
import { SplitSchema, Step } from '../../types/interfaces'

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
        entitySelector: EntitySelector,
        seldonVersionSelector: SeldonVersionSelector,
        modelVersionSelector: ModelVersionSelector,
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
