import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { useMemo } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

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

  const mirroredState = getMirroredState(id, registry.formContext)
  const compareFromState = getCompareFromState(id, registry.formContext) as string | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as string | undefined
  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  if (inCompareMode && !registry.formContext.mirroredModel) {
    const from = compareFromState !== undefined ? compareFromState : (mirroredState as string | undefined)
    return (
      <Stack spacing={1}>
        <Typography
          id={`${id}-label`}
          aria-label={`Label for ${label}`}
          component='label'
          htmlFor={id}
          sx={{ fontWeight: 'bold' }}
        >
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        <InlineDiff from={from} to={value} />
      </Stack>
    )
  }

  const mirroredCompareContent = inCompareMode && registry.formContext.mirroredModel && (
    <InlineDiff from={compareFromMirroredState} to={mirroredState as string | undefined} />
  )
  const displayPanel =
    inCompareMode && registry.formContext.mirroredModel ? true : (registry.formContext.mirroredModel && value) || false

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredCompareContent || mirroredState}
      display={displayPanel}
      label={label}
      id={id}
      required={required}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema.description}
    >
      {inCompareMode && registry.formContext.mirroredModel && <InlineDiff from={compareFromState} to={value} />}
      {!inCompareMode && registry.formContext.editMode && (
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
      {!inCompareMode && !registry.formContext.editMode && (
        <Box sx={{ wordBreak: 'break-word' }}>
          {value || (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
        </Box>
      )}
    </AdditionalInformation>
  )
}
