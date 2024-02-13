import ErrorIcon from '@mui/icons-material/ErrorOutline'
import { Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { StepNoRender } from '../../../../types/interfaces'

interface ValidationErrorIconProps {
  step: StepNoRender
}
export default function ValidationErrorIcon({ step }: ValidationErrorIconProps) {
  const theme = useTheme()

  return !step.isComplete(step) ? (
    <Tooltip title='This step is unfinished' data-test='formStepValidationWarning'>
      <ErrorIcon sx={{ color: theme.palette.error.main }} />
    </Tooltip>
  ) : (
    <></>
  )
}
