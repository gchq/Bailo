import { useState } from 'react'

import Stepper from '@mui/material/Stepper'
import MaterialStep from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { Step } from '../../types/interfaces'

export default function FormDesigner({
  steps,
  setSteps,
  onSubmit,
}: {
  steps: Array<Step>
  setSteps: Function
  onSubmit: Function
}) {
  const [activeStep, setActiveStep] = useState(0)
  const [openValidateError, setOpenValidateError] = useState(false)

  const currentStep = steps[activeStep]

  if (!currentStep) {
    return <></>
  }

  return (
    <>
      <Stepper sx={{ mt: 4, mb: 4 }} activeStep={activeStep} nonLinear alternativeLabel>
        {steps.map((step, index) => (
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

      {currentStep.render(currentStep, steps, setSteps)}
      {currentStep.renderButtons(
        currentStep,
        steps,
        setSteps,
        activeStep,
        setActiveStep,
        onSubmit,
        openValidateError,
        setOpenValidateError
      )}
    </>
  )
}
