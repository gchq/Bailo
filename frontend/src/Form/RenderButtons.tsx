import LoadingButton from '@mui/lab/LoadingButton'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import React, { Dispatch, SetStateAction } from 'react'

import { SplitSchema, Step } from '../../types/interfaces'
import { setStepValidate, validateForm } from '../../utils/formUtils'
import useNotification from '../common/Snackbar'

export interface RenderButtonsInterface {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>

  activeStep: number
  setActiveStep: Dispatch<SetStateAction<number>>

  onSubmit: () => void

  modelUploading: boolean
}

export default function RenderButtons({
  step,
  splitSchema,
  setSplitSchema,
  activeStep,
  setActiveStep,
  onSubmit,
  modelUploading,
}: RenderButtonsInterface) {
  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === splitSchema.steps.length - 1
  const sendNotification = useNotification()

  const onClickNextSection = () => {
    const isValid = validateForm(step)

    if (!isValid) {
      setStepValidate(splitSchema, setSplitSchema, step, true)
      sendNotification({ variant: 'error', msg: 'This tab is not complete.' })
      return
    }
    document.getElementById('form-page-stepper')?.scrollIntoView({ behavior: 'smooth' })
    setActiveStep(activeStep + 1)
  }

  const onClickPreviousSection = () => {
    setActiveStep(activeStep - 1)
    document.getElementById('form-page-stepper')?.scrollIntoView({ behavior: 'smooth' })
  }

  const onClickSubmit = () => {
    const isValid = validateForm(step)

    if (!isValid) {
      setStepValidate(splitSchema, setSplitSchema, step, true)
      sendNotification({ variant: 'error', msg: 'This tab is not complete.' })
      return
    }

    onSubmit()
  }

  return (
    <>
      <Box sx={{ py: 1 }} />
      <Grid container justifyContent='space-between'>
        <Grid item>
          {!isFirstStep && (
            <Button variant='outlined' onClick={onClickPreviousSection}>
              Previous Section
            </Button>
          )}
        </Grid>
        <Grid item>
          {isLastStep ? (
            <LoadingButton onClick={onClickSubmit} loading={modelUploading} variant='contained'>
              Submit
            </LoadingButton>
          ) : (
            <Button variant='contained' onClick={onClickNextSection}>
              Next Section
            </Button>
          )}
        </Grid>
      </Grid>
    </>
  )
}
