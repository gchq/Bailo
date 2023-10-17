import Form from '@rjsf/mui'
import validator from '@rjsf/validator-ajv8'
import { Dispatch, SetStateAction } from 'react'

import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState, widgets } from '../../utils/formUtils'

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
    <Form
      schema={step.schema}
      formData={step.state}
      onChange={onFormChange}
      validator={validator}
      widgets={widgets}
      uiSchema={step.uiSchema}
      liveValidate={step.shouldValidate}
      omitExtraData
      liveOmit
    >
      {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
      <></>
    </Form>
  )
}
