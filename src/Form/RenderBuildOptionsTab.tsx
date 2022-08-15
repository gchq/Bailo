import React from 'react'

import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import FileInput from '../common/FileInput'

export function RenderBuildOptionsTab({
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
    <Stack direction='column' spacing={2} sx={{ p: 3 }}>
      <Box sx={{ textAlign: 'center' }}>
        <FormGroup>
          <Stack direction='row'>
            <FormControlLabel
              control={<Checkbox checked={rawModelExport} />}
              onChange={handleRawModelExportChange}
              label='Enable raw model export'
            />
            <Divider orientation='vertical' flexItem />
            <Box component={Stack} direction='column' justifyContent='center' sx={{ pl: 2 }}>
              <Typography variant='body1'>
                If enabled, allow raw uploaded model files to be downloaded by deployments.
              </Typography>
            </Box>
          </Stack>
        </FormGroup>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <FormGroup>
          <Stack direction='row'>
            <FormControlLabel
              control={<Checkbox checked={allowGuestDeployments} />}
              onChange={handleGuestDeploymentChange}
              label='Allow guest deployment'
            />
            <Divider orientation='vertical' flexItem />
            <Box component={Stack} direction='column' justifyContent='center' sx={{ pl: 2 }}>
              <Typography variant='body1'>
                Allow for models to be accessible for development purposes without creating a deployment request.
              </Typography>
            </Box>
          </Stack>
        </FormGroup>
      </Box>
    </Stack>
  )
}

export function RenderBasicBuildOptionsTab(step: Step, splitSchema: SplitSchema, setSplitSchema: Function) {
  const { state } = step
  const { rawModelExport, allowGuestDeployments } = state

  const handleRawModelExportChange = (event: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, rawModelExport: event.target.checked })
  }

  const handleGuestDeploymentChange = (event: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, allowGuestDeployments: event.target.checked })
  }

  return (
    <Stack direction='column' spacing={2} sx={{ mb: 3 }}>
      <Box sx={{ textAlign: 'center' }}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={rawModelExport} />}
            onChange={handleRawModelExportChange}
            label='Enable raw model export'
          />
        </FormGroup>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={allowGuestDeployments} />}
            onChange={handleGuestDeploymentChange}
            label='Allow guest deployment'
          />
        </FormGroup>
      </Box>
    </Stack>
  )
}
