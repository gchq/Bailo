import { Divider, List, ListItem, ListItemButton, Stack, Stepper, Typography } from '@mui/material'
import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import { useRouter } from 'next/router'
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { SplitSchemaNoRender } from '../../../types/interfaces'
import { setStepState } from '../../../utils/beta/formUtils'
import ValidationErrorIcon from '../../model/beta/common/ValidationErrorIcon'
import CustomTextInput from '../../MuiForms/CustomTextInput'
import Nothing from '../../MuiForms/Nothing'
import TagSelector from '../../MuiForms/TagSelectorBeta'

// TODO - add validation BAI-866
export default function ModelCardForm({
  splitSchema,
  setSplitSchema,
  canEdit = false,
  displayLabelValidation = false,
}: {
  splitSchema: SplitSchemaNoRender
  setSplitSchema: Dispatch<SetStateAction<SplitSchemaNoRender>>
  canEdit?: boolean
  displayLabelValidation?: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)

  const router = useRouter()
  const formPage = router.query.formPage

  useEffect(() => {
    if (formPage) {
      const stepFromUrl = splitSchema.steps.find((step) => step.section === formPage)
      if (stepFromUrl) {
        setActiveStep(stepFromUrl.index)
      }
    }
  }, [formPage, splitSchema.steps])

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return null
  }

  const onFormChange = (form: RJSFSchema) => {
    if (form.schema.title === currentStep.schema.title) {
      setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
    }
  }

  function DescriptionFieldTemplate() {
    return <></>
  }

  function handleListItemClick(index: number, formPageKey: string) {
    setActiveStep(index)
    router.replace({
      query: { ...router.query, formPage: formPageKey },
    })
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      justifyContent='left'
      divider={<Divider flexItem orientation='vertical' />}
      sx={{ width: '100%' }}
    >
      <div>
        <Stepper
          activeStep={activeStep}
          nonLinear
          alternativeLabel
          orientation='vertical'
          connector={<Nothing />}
          sx={{ minWidth: 'max-content' }}
        >
          <List>
            {splitSchema.steps.map((step, index) => (
              <ListItem key={step.schema.title} disablePadding>
                <ListItemButton
                  selected={activeStep === index}
                  onClick={() => handleListItemClick(index, step.section)}
                >
                  <Stack direction='row' spacing={2}>
                    <Typography>{step.schema.title}</Typography>
                    {displayLabelValidation && <ValidationErrorIcon step={step} />}
                  </Stack>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stepper>
      </div>

      <Form
        schema={currentStep.schema}
        formData={currentStep.state}
        onChange={onFormChange}
        validator={validator}
        widgets={{
          nothing: Nothing,
          customTextInput: CustomTextInput,
          tagSelector: TagSelector,
        }}
        uiSchema={currentStep.uiSchema}
        liveValidate={currentStep.shouldValidate}
        omitExtraData
        disabled={!canEdit}
        liveOmit
        formContext={{ editMode: canEdit, formSchema: currentStep.schema }}
        templates={
          !canEdit
            ? {
                DescriptionFieldTemplate,
              }
            : {}
        }
      >
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <></>
      </Form>
    </Stack>
  )
}
