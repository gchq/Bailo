import 'dayjs/locale/en-gb'

import { Box, Button } from '@mui/material'
import { FieldPathId, Registry, RJSFSchema } from '@rjsf/utils'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import MessageAlert from 'src/MessageAlert'
dayjs.extend(customParseFormat)

interface QuestionViewProps {
  label?: string
  id?: string
  registry?: Registry
  schema?: RJSFSchema
  fieldPath?: FieldPathId
}

export default function QuestionViewer({ label, id, schema, registry, fieldPath }: QuestionViewProps) {
  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  if (!id && !fieldPath) {
    return <MessageAlert message='Unable to render widget due to missing ID' severity='error' />
  }

  let componentId = ''
  if (id) {
    componentId = id
  } else if (fieldPath) {
    componentId = fieldPath.$id
  }

  const componentLabel = schema ? schema.title : label

  const schemaPath = `${registry.formContext.rootSection}.${componentId.replace('root_', '').replaceAll('_', '.')}`

  const handleOnClick = () => {
    registry.formContext.onClickListener({ path: schemaPath, schema })
  }

  return (
    <Box key={componentLabel} sx={{ textAlign: 'left' }}>
      <Button
        sx={{ textTransform: 'none', textAlign: 'left' }}
        variant={registry.formContext.activePath === schemaPath ? 'outlined' : 'text'}
        onClick={handleOnClick}
        aria-label={`Select question ${componentLabel}`}
      >
        {componentLabel}
      </Button>
    </Box>
  )
}
