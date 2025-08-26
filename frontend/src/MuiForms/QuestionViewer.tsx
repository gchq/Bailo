import 'dayjs/locale/en-gb'

import { Button, Typography } from '@mui/material'
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

export default function QuestionViewer(props: DateSelectorProps) {
  const { label } = props

  console.log(props)

  return (
    <div key={label}>
      <Button sx={{ textTransform: 'none' }}>{label}</Button>
    </div>
  )
}
