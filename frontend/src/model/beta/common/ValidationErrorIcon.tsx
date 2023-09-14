import ErrorIcon from '@mui/icons-material/ErrorOutline'
import { Tooltip } from '@mui/material'

import { StepNoRender } from '../../../../types/interfaces'

interface ValidationErrorIconProps {
  step: StepNoRender
}
export default function ValidationErrorIcon({ step }: ValidationErrorIconProps) {
  return !step.isComplete(step) ? (
    <Tooltip title='This step is unfinished'>
      <ErrorIcon sx={{ color: 'red' }} />
    </Tooltip>
  ) : (
    <></>
  )
}
