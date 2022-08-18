import { SplitSchema, Step } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'

import { styled } from '@mui/system'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FileInput from '../common/FileInput'

export default function RenderFileTab({
  currentStep: step,
  splitSchema,
  setSplitSchema,
}: {
  currentStep: Step
  splitSchema: SplitSchema
  setSplitSchema: Function
}) {
  const { state } = step
  const { binary, code } = state

  const codeId = 'select-code-file'
  const binaryId = 'select-binary-file'

  const Input = styled('input')({
    display: 'none',
  })

  const handleCodeChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, code: e.target.files[0] })
  }

  const handleBinaryChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, binary: e.target.files[0] })
  }

  const displayFilename = (filename: string) => {
    const parts = filename.split('.')
    const ext = parts.pop()
    const base = parts.join('.')
    return base.length > 12 ? `${base}...${ext}` : filename
  }

  return (
    <Grid container justifyContent='center'>
      <Stack direction='row' spacing={2} sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ p: 1 }} variant='h5'>
            Upload a code file (.zip)
          </Typography>
          <FileInput label='Select Code' onChange={handleCodeChange} file={code} accepts='.zip' />
        </Box>
        <Divider orientation='vertical' flexItem />
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ p: 1 }} variant='h5'>
            Upload a binary file (.zip)
          </Typography>
          <FileInput label='Select Binary' onChange={handleBinaryChange} file={binary} accepts='.zip' />
        </Box>
      </Stack>
    </Grid>
  )
}

export function FileTabComplete(step: Step) {
  return step.state.binary && step.state.code
}
