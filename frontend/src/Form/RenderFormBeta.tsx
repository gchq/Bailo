import Form from '@rjsf/mui'
import { DescriptionFieldProps } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { Dispatch, SetStateAction } from 'react'

import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtilsBeta'
import CustomTextInput from '../MuiForms/CustomTextInput'
import EntitySelector from '../MuiForms/EntitySelectorBeta'
import ModelTypeSelector from '../MuiForms/ModelTypeSelector'
import Nothing from '../MuiForms/Nothing'
import SeldonVersionSelector from '../MuiForms/SeldonVersionSelectorBeta'
import TagSelector from '../MuiForms/TagSelector'
import UserSelector from '../MuiForms/UserSelectorBeta'

export default function RenderFormBeta({
  step,
  splitSchema,
  setSplitSchema,
  canEdit = false,
}: {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  canEdit?: boolean
}) {
  const onFormChange = (form) => {
    if (form.schema.title !== step.schema.title) {
      return
    }

    setStepState(splitSchema, setSplitSchema, step, { ...step.state, ...form.formData })
  }

  function descriptionFieldTemplate(_props: DescriptionFieldProps) {
    return <></>
  }

  return (
    <Form
      schema={step.schema}
      formData={step.state}
      onChange={onFormChange}
      validator={validator}
      noValidate
      widgets={{
        userSelector: UserSelector,
        entitySelector: EntitySelector,
        seldonVersionSelector: SeldonVersionSelector,
        nothing: Nothing,
        customTextInput: CustomTextInput,
        modelTypeSelector: ModelTypeSelector,
        tagSelector: TagSelector,
      }}
      uiSchema={step.uiSchema}
      liveValidate={step.shouldValidate}
      omitExtraData
      disabled={!canEdit}
      liveOmit
      formContext={{ editMode: canEdit, formSchema: step.schema }}
      templates={!canEdit ? { DescriptionFieldTemplate: descriptionFieldTemplate } : {}}
    >
      {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
      <></>
    </Form>
  )
}
