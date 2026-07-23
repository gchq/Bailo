import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { ChangeEvent } from 'react'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import getCompareFieldState from 'src/hooks/useCompareField'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: boolean
  onChange: (newValue: boolean) => void
  InputProps?: any
  id: string
  rawErrors?: string[]
  schema: RJSFSchema
}

export default function CheckboxInput({
  onChange,
  value,
  label,
  registry,
  id,
  required,
  schema,
}: CustomTextInputProps) {
  const theme = useTheme()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value === 'true')
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const compare = getCompareFieldState<boolean>(id, registry.formContext)

  const formatBoolean = (val?: unknown): string | undefined => {
    if (val === undefined) {
      return undefined
    }
    return val ? 'Yes' : 'No'
  }

  if (!compare.editMode && !compare.inCompareMode && value === undefined) {
    return (
      <AdditionalInformation
        editMode={false}
        mirroredState={compare.mirroredState}
        display={compare.isMirroredModel && value !== undefined}
        label={label}
        id={id}
        required={required}
        mirroredModel={compare.isMirroredModel}
        description={schema.description}
      >
        <Typography
          sx={{
            fontStyle: 'italic',
            color: theme.palette.customTextInput.main,
          }}
          aria-label={`Label for ${label}`}
        >
          Unanswered
        </Typography>
      </AdditionalInformation>
    )
  }

  const fallbackMirrored =
    compare.mirroredState !== undefined ? <Typography>{formatBoolean(compare.mirroredState)}</Typography> : undefined

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={value}
      formatter={formatBoolean}
      hasValue={value !== undefined}
      fallbackMirroredContent={fallbackMirrored}
    >
      {compare.editMode ? (
        <RadioGroup onChange={handleChange} value={value} aria-label={`radio input field for ${label}`} id={id}>
          <FormControlLabel value={true} control={<Radio data-test={`${id}-yes-option`} />} label='Yes' />
          <FormControlLabel value={false} control={<Radio data-test={`${id}-no-option`} />} label='No' />
        </RadioGroup>
      ) : compare.inMirroredCompare && value ? (
        <InlineDiff from={formatBoolean(compare.compareFromState)} to={formatBoolean(value)} />
      ) : (
        value && <Typography>{formatBoolean(value)}</Typography>
      )}
    </CompareField>
  )
}
