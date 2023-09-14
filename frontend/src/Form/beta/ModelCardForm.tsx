import ErrorIcon from '@mui/icons-material/ErrorOutline'
import { Divider, Stack, StepButton, StepLabel, Stepper, Tooltip } from '@mui/material'
import MaterialStep from '@mui/material/Step'
import { useTheme } from '@mui/material/styles'
import Form from '@rjsf/mui'
import { RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'
import React, { Dispatch, SetStateAction, useState } from 'react'

import { SplitSchemaNoRender, StepNoRender } from '../../../types/interfaces'
import { setStepState } from '../../../utils/beta/formUtils'
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

  const theme = useTheme()

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

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={4}
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
          {splitSchema.steps.map((step, index) => (
            <MaterialStep key={step.schema.title}>
              <Stack direction='row' spacing={2} justifyContent='center' alignItems='center'>
                <StepButton sx={{ p: 0, m: 0 }} onClick={() => setActiveStep(index)} icon={<Nothing />}>
                  <StepLabel
                    sx={{
                      padding: 0,
                      '& .MuiStepLabel-label': {
                        fontSize: '16px',
                      },
                      '& .MuiStepLabel-label.Mui-active': {
                        color: `${theme.palette.primary.main}`,
                      },
                      '& .Mui-active': {
                        borderBottomStyle: 'solid',
                        borderColor: `${theme.palette.secondary.main}`,
                      },
                    }}
                  >
                    {step.schema.title}
                  </StepLabel>
                </StepButton>
                <ValidationErrorIcon displayLabelValidation={displayLabelValidation} step={step} />
              </Stack>
            </MaterialStep>
          ))}
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

interface ValidationErrorIconProps {
  displayLabelValidation: boolean
  step: StepNoRender
}

function ValidationErrorIcon({ displayLabelValidation, step }: ValidationErrorIconProps) {
  return displayLabelValidation && !step.isComplete(step) ? (
    <Tooltip title='This step is unfinished'>
      <ErrorIcon sx={{ color: 'red' }} />
    </Tooltip>
  ) : (
    <></>
  )
}
