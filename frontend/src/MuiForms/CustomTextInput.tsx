import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { useMemo } from 'react'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import getCompareFieldState from 'src/hooks/useCompareField'
import MessageAlert from 'src/MessageAlert'

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
  schema: RJSFSchema
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
  schema,
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

  const compare = getCompareFieldState<string>(id, registry.formContext)

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={value}
    >
      {compare.inMirroredCompare && value && <InlineDiff from={compare.compareFromState} to={value} />}
      {!compare.inCompareMode && (
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
          variant={!compare.editMode ? 'standard' : 'outlined'}
          required={compare.editMode}
          value={value || (!compare.editMode ? 'Unanswered' : '')}
          disabled={!compare.editMode}
          slotProps={{
            input: {
              ...InputProps,
              ...(!compare.editMode && { disableUnderline: true }),
              'data-test': id,
              'aria-label': `text input field for ${label}`,
              id: id,
            },
          }}
        />
      )}
    </CompareField>
  )
}
