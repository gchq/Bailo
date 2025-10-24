import 'dayjs/locale/en-gb'

import { Box, Button } from '@mui/material'
import { FormContextType, IdSchema, RJSFSchema } from '@rjsf/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import MessageAlert from 'src/MessageAlert'
dayjs.extend(customParseFormat)

interface QuestionViewProps {
  label?: string
  id?: string
  formContext?: FormContextType
  schema?: RJSFSchema
  idSchema?: IdSchema
}

export default function QuestionViewer({ label, id, schema, formContext, idSchema }: QuestionViewProps) {
  if (!formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  if (!id && !idSchema) {
    return <MessageAlert message='Unable to render widget due to missing ID' severity='error' />
  }

  let componentId = ''
  if (id) {
    componentId = id
  } else if (idSchema) {
    componentId = idSchema.$id
  }

  const componentLabel = schema ? schema.title : label

  const schemaPath = `${formContext.rootSection}.${componentId.replace('root_', '').replaceAll('_', '.')}`

  const handleOnClick = () => {
    formContext.onClickListener({ path: schemaPath, schema })
  }

  return (
    <Box key={componentLabel} sx={{ textAlign: 'left' }}>
      <Button
        sx={{ textTransform: 'none', textAlign: 'left' }}
        variant={formContext.activePath === schemaPath ? 'outlined' : 'text'}
        onClick={handleOnClick}
        aria-label={`Select question ${componentLabel}`}
      >
        {componentLabel}
      </Button>
    </Box>
  )
}
