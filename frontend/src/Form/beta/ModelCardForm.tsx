import { Box, Divider, Stack, StepButton, StepLabel, Stepper } from '@mui/material'
import MaterialStep from '@mui/material/Step'
import { useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { DescriptionFieldProps } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import React, { Dispatch, SetStateAction, useState } from 'react'
import CustomTextInput from 'src/MuiForms/CustomTextInput'
import TagSelector from 'src/MuiForms/TagSelector'
import UserSelector from 'src/MuiForms/UserSelectorBeta'
import { setStepState } from 'utils/beta/formUtils'

import { SplitSchema } from '../../../types/interfaces'
import Nothing from '../../MuiForms/Nothing'

export default function ModelCardForm({
  splitSchema,
  setSplitSchema,
  canEdit = false,
}: {
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  canEdit?: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)
  // TODO - add validation
  const [_openValidateError, _setOpenValidateError] = useState(false)

  const theme = useTheme()

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return null
  }

  const onFormChange = (form) => {
    if (form.schema.title !== currentStep.schema.title) {
      return
    }

    setStepState(splitSchema, setSplitSchema, currentStep, { ...currentStep.state, ...form.formData })
  }

  function descriptionFieldTemplate(_props: DescriptionFieldProps) {
    return <></>
  }

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={4}
      justifyContent='left'
      divider={<Divider flexItem orientation='vertical' />}
    >
      <Box>
        <Stepper
          id='form-page-stepper'
          activeStep={activeStep}
          nonLinear
          alternativeLabel
          orientation='vertical'
          connector={<Nothing />}
          sx={{ minWidth: 'max-content' }}
        >
          {splitSchema.steps.map((step, index) => (
            <MaterialStep key={step.schema.title}>
              <StepButton sx={{ p: 0, m: 0 }} onClick={() => setActiveStep(index)} icon={<Nothing />}>
                <StepLabel
                  sx={{
                    padding: 0,
                    '& .MuiStepLabel-label': {
                      fontSize: '16px !important',
                    },
                    '& .Mui-active': {
                      borderBottomStyle: 'groove',
                      color: `${theme.palette.primary.main} !important`,
                      borderColor: `${theme.palette.primary.main} !important`,
                    },
                  }}
                >
                  {step.schema.title}
                </StepLabel>
              </StepButton>
            </MaterialStep>
          ))}
        </Stepper>
      </Box>

      <Form
        schema={currentStep.schema}
        formData={currentStep.state}
        onChange={onFormChange}
        validator={validator}
        noValidate
        widgets={{
          userSelector: UserSelector,
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
        templates={!canEdit ? { DescriptionFieldTemplate: descriptionFieldTemplate } : {}}
      >
        {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
        <></>
      </Form>
    </Stack>
  )
}
