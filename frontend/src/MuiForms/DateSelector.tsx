import 'dayjs/locale/en-gb'

import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs, { Dayjs } from 'dayjs'
import { Fragment } from 'react'

interface CustomTextInputProps {
  label?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string
  onChange: (newValue: string) => void
  InputProps?: any
}

export default function DateInput(props: CustomTextInputProps) {
  const { onChange, value, label, formContext } = props

  const theme = useTheme()
  const handleChange = (dateInput: Dayjs | null) => {
    if (dateInput && dateInput.isValid()) {
      onChange(dateInput.toDate().toISOString().split('T')[0])
    }
    if (dateInput === null) {
      onChange('')
    }
  }

  const displayValue = (dateValue: string) => {
    const [year, month, date] = dateValue.split('-')
    return `${date}/${month}/${year}`
  }

  return (
    <Fragment key={label}>
      <Typography fontWeight='bold'>{label}</Typography>
      {formContext.editMode && (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
          <DatePicker value={dayjs(value)} onChange={handleChange} sx={{ '.MuiInputBase-input': { p: '10px' } }} />
        </LocalizationProvider>
      )}
      {!formContext.editMode && (
        <Typography
          sx={{
            fontStyle: value ? 'unset' : 'italic',
            color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
          }}
        >
          {value ? displayValue(value) : 'Unanswered'}
        </Typography>
      )}
    </Fragment>
  )
}
