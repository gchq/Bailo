import dayjs, { Dayjs } from '@dayjs'
import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { Registry, RJSFSchema } from '@rjsf/utils'
import InlineDiff from 'src/common/InlineDiff'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

interface DateSelectorProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  registry?: Registry
  value: string
  onChange: (newValue: string | undefined) => void
  InputProps?: any
  id: string
  schema: RJSFSchema
}

export default function DateSelector({ onChange, value, label, registry, required, id, schema }: DateSelectorProps) {
  const theme = useTheme()

  const handleChange = (dateInput: Dayjs | null) => {
    if (dateInput && dateInput.isValid()) {
      onChange(dateInput.format('YYYY-MM-DD'))
    } else {
      onChange(undefined)
    }
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext) as string | undefined

  const compareFromState = getCompareFromState(id, registry.formContext) as string | undefined

  const compareFromMirroredState = getCompareFromMirroredState(id, registry.formContext) as string | undefined

  const inCompareMode = !!registry.formContext.compareMode && !registry.formContext.editMode

  const formatDate = (val?: string) => {
    if (!val) {
      return
    }

    return dayjs(val).format('DD-MM-YYYY')
  }

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
        <InlineDiff from={formatDate(from)} to={formatDate(value)} />
      </AdditionalInformation>
    )
  }

  const mirroredContent =
    inCompareMode && registry.formContext.mirroredModel && value ? (
      <InlineDiff from={formatDate(compareFromMirroredState)} to={formatDate(mirroredState)} />
    ) : (
      formatDate(mirroredState)
    )

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredContent}
      display={Boolean(registry.formContext.mirroredModel && (value || mirroredState))}
      label={label}
      id={id}
      required={required}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema.description}
    >
      {registry.formContext.editMode ? (
        <DatePicker
          // MUI DatePicker requires null (not undefined) for empty state to correctly re-render when the value changes externally
          value={value ? dayjs(value) : null}
          aria-label={`date input field for ${label}`}
          onChange={handleChange}
          format='DD-MM-YYYY'
          sx={{ '.MuiInputBase-input': { p: '10px' } }}
        />
      ) : inCompareMode && registry.formContext.mirroredModel && value ? (
        <InlineDiff from={formatDate(compareFromState)} to={formatDate(value)} />
      ) : (
        <Typography
          sx={{
            fontStyle: value ? 'unset' : 'italic',
            color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
          }}
        >
          {value ? formatDate(value) : 'Unanswered'}
        </Typography>
      )}
    </AdditionalInformation>
  )
}
