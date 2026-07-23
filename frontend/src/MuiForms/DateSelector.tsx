import dayjs, { Dayjs } from '@dayjs'
import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { Registry, RJSFSchema } from '@rjsf/utils'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import getCompareFieldState from 'src/hooks/useCompareField'
import MessageAlert from 'src/MessageAlert'

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

  const compare = getCompareFieldState<string>(id, registry.formContext)

  const formatDate = (val?: unknown): string | undefined => {
    if (!val || typeof val !== 'string') {
      return undefined
    }
    return dayjs(val).format('DD-MM-YYYY')
  }

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={value}
      formatter={formatDate}
      fallbackMirroredContent={formatDate(compare.mirroredState)}
    >
      {compare.editMode ? (
        <DatePicker
          value={value ? dayjs(value) : null}
          aria-label={`date input field for ${label}`}
          onChange={handleChange}
          format='DD-MM-YYYY'
          sx={{ '.MuiInputBase-input': { p: '10px' } }}
        />
      ) : compare.inMirroredCompare && value ? (
        <InlineDiff from={formatDate(compare.compareFromState)} to={formatDate(value)} />
      ) : (
        value && (
          <Typography
            sx={{
              fontStyle: value ? 'unset' : 'italic',
              color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
            }}
          >
            {formatDate(value)}
          </Typography>
        )
      )}
    </CompareField>
  )
}
