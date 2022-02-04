import { useState } from 'react'

import Stepper from '@mui/material/Stepper'
import MaterialStep from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

import { Step } from '../../types/interfaces'
import { setStepState, setStepValidate, validateForm } from 'utils/formUtils'

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

  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === steps.length - 1

  if (!currentStep) {
    return <></>
  }

  const onClickNextSection = () => {
    const isValid = validateForm(currentStep)

    if (!isValid) {
      setStepValidate(steps, setSteps, currentStep, true)
      setOpenValidateError(true)
      return
    }

    setActiveStep(activeStep + 1)
  }

  const onClickSubmit = () => {
    const isValid = validateForm(currentStep)

    if (!isValid) {
      setStepValidate(steps, setSteps, currentStep, true)
      setOpenValidateError(true)
      return
    }

    onSubmit()
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

      <Box sx={{ py: 1 }} />
      <Grid container justifyContent='space-between'>
        <Grid item>
          {!isFirstStep && (
            <Button variant='outlined' onClick={() => setActiveStep(activeStep - 1)}>
              Previous Section
            </Button>
          )}
        </Grid>
        <Grid item>
          {isLastStep ? (
            <Button variant='contained' onClick={onClickSubmit}>
              Submit
            </Button>
          ) : (
            <Button variant='contained' onClick={onClickNextSection}>
              Next Section
            </Button>
          )}
        </Grid>
      </Grid>

      <Snackbar open={openValidateError} autoHideDuration={6000} onClose={() => setOpenValidateError(false)}>
        <Alert onClose={() => setOpenValidateError(false)} severity='error' sx={{ width: '100%' }}>
          This tab is not complete.
        </Alert>
      </Snackbar>
    </>
  )
}
