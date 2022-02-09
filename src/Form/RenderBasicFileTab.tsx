import { Step } from 'types/interfaces'
import { setStepState } from 'utils/formUtils'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import FileInput from '../common/FileInput'

export default function RenderBasicFileTab(step: Step, steps: Array<Step>, setSteps: Function) {
  const { state } = step
  const { binary, code } = state

  const handleCodeChange = (e: any) => {
    setStepState(steps, setSteps, step, { ...state, code: e.target.files[0] })
  }

  const handleBinaryChange = (e: any) => {
    setStepState(steps, setSteps, step, { ...state, binary: e.target.files[0] })
  }

  return (
    <Box sx={{ pb: 4, pt: 4 }}>
      <Stack direction='row' spacing={2} alignItems='center'>
        <FileInput label={'Select Code'} file={code} onChange={handleCodeChange} accepts='.zip' />
        <FileInput label={'Select Binary'} file={binary} onChange={handleBinaryChange} accepts='.zip' />
      </Stack>
    </Box>
  )
}

export function BasicFileTabComplete(step: Step) {
  return step.state.binary && step.state.code
}
