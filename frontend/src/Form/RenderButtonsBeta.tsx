import LoadingButton from '@mui/lab/LoadingButton'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import React, { Dispatch, ReactElement, SetStateAction } from 'react'

import { SplitSchema, Step } from '../../types/interfaces'
import { setStepValidate, validateForm } from '../../utils/formUtilsBeta'
import useNotification from '../common/Snackbar'

export interface RenderButtonsInterface {
  step: Step
  splitSchema: SplitSchema
  canEdit?: boolean
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
  onSubmit,
  modelUploading,
  canEdit = false,
}: RenderButtonsInterface): ReactElement | null {
  const onClickSubmit = () => {
    // TODO decide when we handle validation
    onSubmit()
  }
  if (!canEdit) {
    return null
  }
  return (
    <>
      <Box sx={{ py: 1 }} />
      <Grid container justifyContent='space-between'>
        <Grid item>
          <LoadingButton onClick={onClickSubmit} loading={modelUploading} variant='contained'>
            Save
          </LoadingButton>
        </Grid>
      </Grid>
    </>
  )
}
