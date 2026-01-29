import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry } from '@rjsf/utils'
import { useMemo } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getMirroredState } from 'utils/formUtils'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  id: string
  rawErrors?: string[]
}

export default function CustomTextInput({
  onChange,
  value,
  label,
  registry,
  id,
  required,
  rawErrors,
  InputProps,
}: CustomTextInputProps) {
  const theme = useTheme()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext)

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredState}
      display={registry.formContext.mirroredModel && value}
      label={label}
      id={id}
      required={required}
      mirroredModel={registry.formContext.mirroredModel}
    >
      {registry.formContext.editMode && (
        <TextField
          size='small'
          error={rawErrors && rawErrors.length > 0}
          sx={[
            (theme) => ({
              input: {
                color: theme.palette.common.white,
                ...theme.applyStyles('light', {
                  color: theme.palette.common.black,
                }),
              },
              width: '100%',
              label: {
                WebkitTextFillColor: theme.palette.common.white,
                ...theme.applyStyles('light', {
                  WebkitTextFillColor: theme.palette.common.black,
                }),
              },
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: disabledWebkitTextFillColor,
              },
            }),
            value
              ? {
                  fontStyle: 'unset',
                }
              : {
                  fontStyle: 'italic',
                },
          ]}
          onChange={handleChange}
          variant={!registry.formContext.editMode ? 'standard' : 'outlined'}
          required={registry.formContext.editMode}
          value={value || (!registry.formContext.editMode ? 'Unanswered' : '')}
          disabled={!registry.formContext.editMode}
          slotProps={{
            input: {
              ...InputProps,
              ...(!registry.formContext.editMode && { disableUnderline: true }),
              'data-test': id,
              'aria-label': `text input field for ${label}`,
              id: id,
            },
          }}
        />
      )}
      {!registry.formContext.editMode && <Box>{value}</Box>}
    </AdditionalInformation>
  )
}
