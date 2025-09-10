import 'dayjs/locale/en-gb'

import { Box, Button } from '@mui/material'
import { FormContextType, RJSFSchema } from '@rjsf/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import MessageAlert from 'src/MessageAlert'
dayjs.extend(customParseFormat)

interface QuestionViewProps {
  label?: string
  id?: string
  formContext?: FormContextType
  schema?: RJSFSchema
}

export default function QuestionViewer({ label, id, schema, formContext }: QuestionViewProps) {
  if (!formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  if (!id) {
    return <MessageAlert message='Unable to render widget due to missing ID' severity='error' />
  }

  const schemaPath = `${formContext.rootSection}.${id.replace('root_', '').replaceAll('_', '.')}`

  const handleOnClick = () => {
    formContext.onClickListener({ path: schemaPath, schema })
  }

  return (
    <Box key={label} sx={{ textAlign: 'left' }}>
      <Button
        sx={{ textTransform: 'none', textAlign: 'left' }}
        variant={formContext.activePath === schemaPath ? 'outlined' : 'text'}
        onClick={handleOnClick}
        aria-label={`Select question ${label}`}
      >
        {label}
      </Button>
    </Box>
  )
}
