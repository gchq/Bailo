import React, { Dispatch, SetStateAction, useState } from 'react'
import Edit from '@mui/icons-material/Edit'
import LoadingButton from '@mui/lab/LoadingButton'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useGetUiConfig } from '../../data/uiConfig'

function ModelEditSubmission({
  onSubmit,
  activeStep,
  setActiveStep,
  modelUploading,
}: {
  onSubmit: any
  activeStep: number
  setActiveStep: Dispatch<SetStateAction<number>>
  modelUploading: boolean
}) {
  const [warningCheckboxVal, setWarningCheckboxVal] = useState<boolean>(false)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const handleCheckboxChange = (e) => {
    setWarningCheckboxVal(e.target.checked)
  }

  if (isUiConfigError || isUiConfigLoading || !uiConfig) {
    return null
  }

  return (
    <>
      <Grid container justifyContent='center'>
        {uiConfig.uploadWarning.showWarning && (
          <Alert sx={{ width: '100%' }} severity={warningCheckboxVal ? 'success' : 'warning'}>
            <Checkbox size='small' checked={warningCheckboxVal} onChange={handleCheckboxChange} sx={{ p: 0, mr: 1 }} />
            {uiConfig.uploadWarning.checkboxText}
          </Alert>
        )}
        <Stack direction='row' spacing={2} sx={{ mt: 5, mb: 5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Edit color='primary' sx={{ pt: 1, color: 'primary', fontSize: 75 }} />
            <Typography sx={{ p: 1 }} variant='h6'>
              Edit Model
            </Typography>
            <Typography sx={{ p: 1, mb: 1.5 }} variant='body1' component='p'>
              If you are happy with your submission click below to upload your model to Bailo.
            </Typography>
            <LoadingButton
              onClick={onSubmit}
              loading={modelUploading}
              variant='contained'
              disabled={uiConfig.uploadWarning.showWarning && !warningCheckboxVal}
            >
              Submit
            </LoadingButton>
          </Box>
        </Stack>
      </Grid>
      <Box sx={{ textAlign: 'left' }}>
        <Button variant='outlined' onClick={() => setActiveStep(activeStep - 1)}>
          Previous Section
        </Button>
      </Box>
    </>
  )
}

export default ModelEditSubmission
