import { useState } from 'react'

import Stepper from '@mui/material/Stepper'
import MaterialStep from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

import { Step } from '../../types/interfaces'

export default function FormDesigner({ steps, setSteps, onSubmit }: {
  steps: Array<Step>,
  setSteps: Function,
  onSubmit: Function
}) {
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = steps[activeStep]

  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === steps.length - 1

  if (!currentStep) {
    return <></>
  }

  console.log('currentStep', currentStep)

  return <>
    <Stepper sx={{ mt: 4, mb: 4 }} activeStep={activeStep} nonLinear alternativeLabel>
      {steps.map((step, index) => (
        <MaterialStep key={step.schema.title}>
          <StepButton onClick={() => setActiveStep(index)}>{step.schema.title}</StepButton>
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
          <Button variant='contained' onClick={() => onSubmit()}>
            Submit
          </Button>
        ) : (
          <Button variant='contained' onClick={() => setActiveStep(activeStep + 1)}>
            Next Section
          </Button>
        )}
      </Grid>
    </Grid>
  </>
}