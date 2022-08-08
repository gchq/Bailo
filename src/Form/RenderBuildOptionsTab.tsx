import React from 'react'

import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'

import { styled } from '@mui/system'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'


export default function RenderBuildOptionsTab({
  currentStep: step,
  splitSchema,
  setSplitSchema,
}: {
  currentStep: Step
  splitSchema: SplitSchema
  setSplitSchema: Function
}) {

  const { state } = step
  const { rawModelExport, allowGuestDeployments } = state

  const handleRawModelExportChange = (event: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, rawModelExport: event.target.checked })
  }

  const handleGuestDeploymentChange = (event: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, allowGuestDeployments: event.target.checked })
  }

  return (
    <Grid container justifyContent='center'>
      <Stack direction='column' spacing={2} sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={rawModelExport}/>} onChange={handleRawModelExportChange} label="Enable raw model export" />
        </FormGroup>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
        <FormGroup>
          <FormControlLabel control={<Checkbox checked={allowGuestDeployments}/>} onChange={handleGuestDeploymentChange} label="Allow guest deployment" />
        </FormGroup>
        </Box>
      </Stack>
    </Grid>
  )
}
