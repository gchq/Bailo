import TextField, { TextFieldProps } from '@mui/material/TextField'
import { TEXT_INPUT_MAX_LENGTH } from 'utils/inputLimits'

type LimitedTextFieldProps = TextFieldProps & {
  maxLength?: number
}

export default function LimitedTextField({
  maxLength = TEXT_INPUT_MAX_LENGTH,
  slotProps,
  ...props
}: LimitedTextFieldProps) {
  const htmlInput = slotProps?.htmlInput

  return (
    <TextField
      {...props}
      slotProps={{
        ...slotProps,
        htmlInput:
          typeof htmlInput === 'function'
            ? (ownerState) => ({ ...htmlInput(ownerState), maxLength })
            : { ...htmlInput, maxLength },
      }}
    />
  )
}
