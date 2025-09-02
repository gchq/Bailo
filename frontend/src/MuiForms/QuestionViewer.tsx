import 'dayjs/locale/en-gb'

import { Button } from '@mui/material'
import { FormContextType } from '@rjsf/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Fragment } from 'react'
import MessageAlert from 'src/MessageAlert'
dayjs.extend(customParseFormat)

interface QuestionViewProps {
  label?: string
  id?: string
  formContext?: FormContextType
  schema?: any
}

export default function QuestionViewer({ label, id, schema, formContext }: QuestionViewProps) {
  if (!formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const handleOnClick = () => {
    const schemaPath = `${formContext.rootSection}.${id?.substring(4).replaceAll('_', 'properties.')}`
    formContext.onClickListener({ path: schemaPath, schema })
  }

  return (
    <Fragment key={label}>
      <Button sx={{ textTransform: 'none', textAlign: 'left' }} onClick={handleOnClick}>
        {label}
      </Button>
    </Fragment>
  )
}
