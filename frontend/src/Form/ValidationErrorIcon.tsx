import ErrorIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface ValidationErrorIconProps {
  isComplete: boolean
}
export default function ValidationErrorIcon({ isComplete }: ValidationErrorIconProps) {
  const theme = useTheme()

  return !isComplete ? (
    <Tooltip title='This step is unfinished' data-test='formStepValidationWarning'>
      <ErrorIcon sx={{ color: theme.palette.error.main }} />
    </Tooltip>
  ) : (
    <></>
  )
}
