import { Autocomplete, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { SyntheticEvent, useMemo } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

interface MultipleDropdownProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: string[]
  onChange: (newValue: string[]) => void
  InputProps?: any
  options: { enumOptions?: { label: string; value: string }[] }
  rawErrors?: string[]
  id: string
  schema: RJSFSchema
}

export default function MultipleDropdown({
  label,
  registry,
  value,
  onChange,
  options,
  required,
  rawErrors,
  id,
  schema,
}: MultipleDropdownProps) {
  const theme = useTheme()

  const handleChange = (_event: SyntheticEvent<Element, Event>, newValue: string[]) => {
    onChange(newValue)
  }

  const disabledWebkitTextFillColor = useMemo(() => {
    if (value.length) {
      return theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white
    } else {
      return theme.palette.customTextInput.main
    }
  }, [theme, value])

  const multipleDropdownOptions = useMemo(() => {
    return options.enumOptions ? options.enumOptions.map((option) => option.value) : []
  }, [options])

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  /**
   * In some instances where we use mirroredCard data to structure the form, arrays might be initialised
   * as [null]. If this is the case, we need to make sure it is removed from the state.
   */
  if (value.length === 1 && value[0] === null) {
    onChange([])
  }

  const mirroredState = getMirroredState(id, registry.formContext) as string[] | undefined
  const compareFromState = getCompareFromState(id, registry.formContext) as string[] | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as string[] | undefined
  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  const formatValues = (val: string[] | undefined): string => (val && val.length ? [...val].join('\n') : '')

  if (inCompareMode && !registry.formContext.mirroredModel) {
    const from = compareFromState ?? mirroredState
    return (
      <AdditionalInformation
        editMode={registry.formContext.editMode}
        mirroredState={mirroredState}
        display={false}
        label={label}
        id={id}
        required={required}
        mirroredModel={registry.formContext.mirroredModel}
        description={schema.description}
      >
        <InlineDiff from={formatValues(from)} to={formatValues(value)} />
      </AdditionalInformation>
    )
  }

  const mirroredContent =
    inCompareMode && registry.formContext.mirroredModel && value ? (
      <InlineDiff from={compareFromMirroredState} to={mirroredState} />
    ) : mirroredState ? (
      <Typography>{mirroredState}</Typography>
    ) : (
      <Typography sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>Unanswered</Typography>
    )

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredContent}
      display={
        inCompareMode && registry.formContext.mirroredModel
          ? true
          : registry.formContext.mirroredModel && value.length > 0
      }
      label={label}
      id={id}
      required={required}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema.description}
    >
      {registry.formContext.editMode ? (
        <Autocomplete
          multiple
          size='small'
          getOptionLabel={(option) => option}
          options={multipleDropdownOptions}
          sx={(theme) => ({
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
          })}
          onChange={handleChange}
          value={value || []}
          disabled={!registry.formContext.editMode}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Select an option below'
              size='small'
              id={id}
              aria-label={`input field for ${label}`}
              placeholder={value.length ? undefined : 'Unanswered'}
              error={rawErrors && rawErrors.length > 0}
            />
          )}
        />
      ) : inCompareMode && registry.formContext.mirroredModel && value.length > 0 ? (
        <InlineDiff from={formatValues(compareFromState)} to={formatValues(value)} />
      ) : (
        value.length > 0 &&
        value.map((selectedValue) => (
          <Typography
            key={selectedValue}
            sx={{
              fontStyle: 'unset',
              color: theme.palette.common.black,
            }}
          >
            {selectedValue}
          </Typography>
        ))
      )}
    </AdditionalInformation>
  )
}
