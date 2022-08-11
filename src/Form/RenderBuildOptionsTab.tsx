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
                Model code and binary files can be store/accessed directly from Minio
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
                Allow for deployments to be requested without the need of creating metadata
              </Typography>
            </Box>
          </Stack>
        </FormGroup>
      </Box>
    </Stack>
  )
}
