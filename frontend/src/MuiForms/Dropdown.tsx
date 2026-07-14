import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { SyntheticEvent, useMemo } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

interface DropdownProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
  options: { enumOptions?: { label: string; value: string }[] }
  rawErrors?: string[]
  id: string
  schema: RJSFSchema
}

export default function Dropdown({
  label,
  registry,
  value,
  onChange,
  options,
  required,
  rawErrors,
  id,
  schema,
}: DropdownProps) {
  const theme = useTheme()

  const handleChange = (_event: SyntheticEvent<Element, Event>, newValue: string | null) => {
    onChange(newValue || '')
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  const dropdownOptions = useMemo(() => {
    return options.enumOptions ? options.enumOptions.map((option) => option.value) : []
  }, [options])

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext) as string | undefined
  const compareFromState = getCompareFromState(id, registry.formContext) as string | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as string | undefined

  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode
  const isMirroredModel = !!registry.formContext.mirroredModel
  const inMirroredCompare = inCompareMode && isMirroredModel

  if (inCompareMode && !isMirroredModel) {
    const from = compareFromState ?? mirroredState
    return (
      <AdditionalInformation
        editMode={false}
        label={label}
        id={id}
        required={required}
        mirroredModel={false}
        description={schema.description}
      >
        <InlineDiff from={from} to={value} />
      </AdditionalInformation>
    )
  }

  const mirroredContent = inMirroredCompare ? (
    <InlineDiff from={compareFromMirroredState} to={mirroredState} />
  ) : (
    mirroredState
  )

  const displayPanel =
    inCompareMode && registry.formContext.mirroredModel ? true : registry.formContext.mirroredModel && value

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredContent}
      display={displayPanel}
      label={label}
      id={id}
      required={required}
      mirroredModel={isMirroredModel}
      description={schema.description}
    >
      {registry.formContext.editMode ? (
        <Autocomplete
          size='small'
          options={dropdownOptions}
          sx={(theme) => ({
            input: {
              color: theme.palette.common.white,
              ...theme.applyStyles('light', {
                color: theme.palette.common.black,
              }),
              id: id,
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
          })}
          onChange={handleChange}
          value={value || ''}
          disabled={!registry.formContext.editMode}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Select an option below'
              size='small'
              placeholder='Unanswered'
              aria-label={`input field for ${label}`}
              error={rawErrors && rawErrors.length > 0}
            />
          )}
        />
      ) : inCompareMode && registry.formContext.mirroredModel ? (
        <InlineDiff from={compareFromState} to={value} />
      ) : value ? (
        <Typography>{value}</Typography>
      ) : (
        <Typography sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>Unanswered</Typography>
      )}
    </AdditionalInformation>
  )
}
