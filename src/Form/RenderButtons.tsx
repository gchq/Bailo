import LoadingButton from '@mui/lab/LoadingButton'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import { Dispatch, SetStateAction } from 'react'
import { SplitSchema, Step } from '../../types/interfaces'
import { setStepValidate, validateForm } from '../../utils/formUtils'

export interface RenderButtonsInterface {
  step: Step
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>

  activeStep: number
  setActiveStep: Dispatch<SetStateAction<number>>

  onSubmit: () => void

  openValidateError: boolean
  setOpenValidateError: Dispatch<SetStateAction<boolean>>

  modelUploading: boolean
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
