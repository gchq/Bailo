import 'dayjs/locale/en-gb'

import { Button } from '@mui/material'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

interface QuestionViewProps {
  label?: string
  id?: string
  formContext?: any
  schema?: any
}

export default function QuestionViewer({ label, id, schema, formContext }: QuestionViewProps) {
  const handleOnClick = () => {
    const schemaPath = `${formContext.rootSection}.${id?.substring(4).replaceAll('_', 'properties.')}`
    formContext.onClickListener({ path: schemaPath, schema })
  }

  return (
    <div key={label}>
      <Button sx={{ textTransform: 'none', textAlign: 'left' }} onClick={handleOnClick}>
        {label}
      </Button>
    </div>
  )
}
