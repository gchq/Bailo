import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry } from '@rjsf/utils'
import { Fragment, useMemo } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'

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

  if (!registry.formContext.editMode && registry.formContext.mirroredModel) {
    const mirroredState = id
      .replaceAll('root_', '')
      .replaceAll('_', '.')
      .split('.')
      .filter((t) => t !== '')
      .reduce((prev, cur) => prev && prev[cur], registry.formContext.mirroredState)
    return (
      <>
        <Typography fontWeight='bold' aria-label={`label for ${label}`}>
          {label}
        </Typography>
        {mirroredState ? (
          <Typography>{mirroredState}</Typography>
        ) : (
          <Typography
            sx={{
              fontStyle: 'italic',
              color: theme.palette.customTextInput.main,
            }}
          >
            Unanswered
          </Typography>
        )}
        <AdditionalInformation>{value ? <Typography>{value}</Typography> : undefined}</AdditionalInformation>
      </>
    )
  }

  return (
    <Fragment key={label}>
      <Typography id={`${id}-label`} fontWeight='bold' aria-label={`Label for ${label}`} component='label' htmlFor={id}>
        {label}
        {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
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
    </Fragment>
  )
}
