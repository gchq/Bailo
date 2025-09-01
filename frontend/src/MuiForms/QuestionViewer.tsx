import 'dayjs/locale/en-gb'

import { Button, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Fragment, useEffect, useRef } from 'react'
dayjs.extend(customParseFormat)

interface QuestionViewProps {
  label?: string
  id?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  formContext?: any
  schema?: any
  value: string
  onChange: (newValue: string | undefined) => void
  InputProps?: any
}

export default function QuestionViewer(props: QuestionViewProps) {
  const { label, id, schema } = props

  const handleOnClick = () => {
    const schemaPath = `${props.formContext.rootSection}.${id?.substring(4).replaceAll('_', 'properties.')}`
    props.formContext.onClickListener({ path: schemaPath, schema })
  }

  return (
    <div key={label}>
      <Button sx={{ textTransform: 'none', textAlign: 'left' }} onClick={handleOnClick}>
        {label}
      </Button>
    </div>
  )
}
