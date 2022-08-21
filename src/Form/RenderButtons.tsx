import { Dispatch, SetStateAction } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import LoadingButton from '@mui/lab/LoadingButton'

import { setStepValidate, validateForm } from '../../utils/formUtils'
import { SplitSchema, Step } from '../../types/interfaces'

export interface RenderButtonsInterface {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>

  activeStep: number
  setActiveStep: Dispatch<SetStateAction<number>>

  onSubmit: () => {}

  openValidateError: boolean
  setOpenValidateError: Dispatch<SetStateAction<boolean>>

  modelUploading: boolean | undefined
}

export default function RenderButtons({
  step,
  splitSchema,
  setSplitSchema,
  activeStep,
  setActiveStep,
  onSubmit,
  openValidateError,
  setOpenValidateError,
  modelUploading,
}: RenderButtonsInterface) {
  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === splitSchema.steps.length - 1

  const onClickNextSection = () => {
    const isValid = validateForm(step)

    if (!isValid) {
      setStepValidate(splitSchema, setSplitSchema, step, true)
      setOpenValidateError(true)
      return
    }

    setActiveStep(activeStep + 1)
  }

  const onClickSubmit = () => {
    const isValid = validateForm(step)

    if (!isValid) {
      setStepValidate(splitSchema, setSplitSchema, step, true)
      setOpenValidateError(true)
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
            <Button variant='outlined' onClick={() => setActiveStep(activeStep - 1)}>
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

      <Snackbar open={openValidateError} autoHideDuration={6000} onClose={() => setOpenValidateError(false)}>
        <Alert onClose={() => setOpenValidateError(false)} severity='error' sx={{ width: '100%' }}>
          This tab is not complete.
        </Alert>
      </Snackbar>
    </>
  )
}
