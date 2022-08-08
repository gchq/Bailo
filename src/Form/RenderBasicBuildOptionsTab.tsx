import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export default function RenderBasicBuildOptionsTab(step: Step, splitSchema: SplitSchema, setSplitSchema: Function) {
  const { state } = step

  return (
    <Box sx={{ pb: 4, pt: 4 }}>
      <Stack direction='row' spacing={2} alignItems='center'>
        <Typography>test</Typography>
      </Stack>
    </Box>
  )
}
