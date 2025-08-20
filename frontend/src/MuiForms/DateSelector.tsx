import 'dayjs/locale/en-gb'

import { Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Fragment, useEffect, useRef } from 'react'
dayjs.extend(customParseFormat)

interface DateSelectorProps {
  label?: string
  id?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  value: string
  onChange: (newValue: string | undefined) => void
  InputProps?: any
}

export default function DateSelector(props: DateSelectorProps) {
  const { onChange, value, label, formContext, required, id } = props

  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  const handleChange = (dateInput: Dayjs | null) => {
    if (dateInput && dateInput.isValid()) {
      onChange(dateInput.format('YYYY-MM-DD'))
    } else {
      onChange(undefined)
    }
  }

  useEffect(() => {
    document.body.addEventListener('click', (event) => {
      if (ref.current) {
        const questionComponent = event.composedPath().includes(ref.current)
        if (ref.current && questionComponent) {
          formContext.onClickListener(id)
        }
      }
    })
  }, [formContext])

  return (
    <div ref={ref} key={label}>
      <Typography fontWeight='bold'>
        {label} {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
      </Typography>
      {formContext.editMode && (
        <DatePicker
          value={value ? dayjs(value) : undefined}
          onChange={handleChange}
          format='DD-MM-YYYY'
          sx={{ '.MuiInputBase-input': { p: '10px' } }}
        />
      )}
      {!formContext.editMode && (
        <Typography
          sx={{
            fontStyle: value ? 'unset' : 'italic',
            color: value ? theme.palette.common.black : theme.palette.customTextInput.main,
          }}
        >
          {value ? dayjs(value).format('DD-MM-YYYY') : 'Unanswered'}
        </Typography>
      )}
    </div>
  )
}
