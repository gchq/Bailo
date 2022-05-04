import { Dispatch, SetStateAction, useState } from 'react'

import Stepper from '@mui/material/Stepper'
import MaterialStep from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { SplitSchema } from '../../types/interfaces'

export default function FormDesigner({
  splitSchema,
  setSplitSchema,
  onSubmit,
  modelUploading,
}: {
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  onSubmit: Function
  modelUploading: boolean
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [openValidateError, setOpenValidateError] = useState(false)

  const currentStep = splitSchema.steps[activeStep]

  if (!currentStep) {
    return <></>
  }

  const Render = currentStep.render

  return (
    <>
      <Stepper sx={{ mt: 4, mb: 4 }} activeStep={activeStep} nonLinear alternativeLabel>
        {splitSchema.steps.map((step, index) => (
          <MaterialStep key={step.schema.title}>
            <StepButton onClick={() => setActiveStep(index)}>{step.schema.title}</StepButton>
            {step.type !== 'Message' && (
              <Box sx={{ textAlign: 'center' }}>
                {step.isComplete(step) ? (
                  <Typography sx={{ color: 'green' }} variant='caption'>
                    Complete
                  </Typography>
                ) : (
                  <Typography sx={{ color: 'orange' }} variant='caption'>
                    In progress
                  </Typography>
                )}
              </Box>
            )}
          </MaterialStep>
        ))}
      </Stepper>

      <Render currentStep={currentStep} splitSchema={splitSchema} setSplitSchema={setSplitSchema} />
      {currentStep.renderButtons(
        currentStep,
        splitSchema,
        setSplitSchema,
        activeStep,
        setActiveStep,
        onSubmit,
        openValidateError,
        setOpenValidateError,
        modelUploading
      )}
    </>
  )
}
