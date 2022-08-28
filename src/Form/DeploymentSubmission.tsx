import React, { Dispatch, SetStateAction, useState } from 'react'
import CloudUpload from '@mui/icons-material/CloudUpload'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useGetUiConfig } from '../../data/uiConfig'

function DeploymentSubmission({
  onSubmit,
  activeStep,
  setActiveStep,
}: {
  onSubmit: any
  activeStep: number
  setActiveStep: Dispatch<SetStateAction<number>>
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
        {uiConfig.deploymentWarning.showWarning && (
          <Alert sx={{ width: '100%' }} severity={warningCheckboxVal ? 'success' : 'warning'}>
            <AlertTitle sx={{ m: 0 }}>
              <Checkbox
                sx={{ p: '0px !important', mr: 1 }}
                checked={warningCheckboxVal}
                onChange={handleCheckboxChange}
              />
              {uiConfig.deploymentWarning.checkboxText}
            </AlertTitle>
          </Alert>
        )}
        <Stack direction='row' spacing={2} sx={{ mt: 5, mb: 5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CloudUpload color='primary' sx={{ pt: 1, color: 'primary', fontSize: 75 }} />
            <Typography sx={{ p: 1 }} variant='h6'>
              Request Deployment
            </Typography>
            <Typography sx={{ p: 1, mb: 1.5 }} variant='body1' component='p'>
              If you are happy with your submission click below to request your deployment.
            </Typography>
            <Button
              onClick={onSubmit}
              variant='contained'
              disabled={uiConfig.deploymentWarning.showWarning && !warningCheckboxVal}
            >
              Request
            </Button>
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

export default DeploymentSubmission
