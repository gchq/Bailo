import 'dayjs/locale/en-gb'

import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { Registry } from '@rjsf/utils'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Fragment } from 'react'
import MessageAlert from 'src/MessageAlert'
dayjs.extend(customParseFormat)

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
}

export default function DateSelector({ onChange, value, label, registry, required, id }: DateSelectorProps) {
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

  return (
    <Fragment key={label}>
      <Typography fontWeight='bold' aria-label={`label for ${label}`} component='label' htmlFor={id}>
        {label} {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      {registry.formContext.editMode && (
        <DatePicker
          value={value ? dayjs(value) : undefined}
          aria-label={`date input field for ${label}`}
          onChange={handleChange}
          label={label}
          format='DD-MM-YYYY'
          sx={{ '.MuiInputBase-input': { p: '10px' } }}
        />
      )}
      {!registry.formContext.editMode && (
        <Typography
          sx={{
            fontStyle: value ? 'unset' : 'italic',
            color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
          }}
        >
          {value ? dayjs(value).format('DD-MM-YYYY') : 'Unanswered'}
        </Typography>
      )}
    </Fragment>
  )
}
