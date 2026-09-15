import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import Error from '@mui/icons-material/ErrorOutlineOutlined'
import Share from '@mui/icons-material/Share'
import { Box, Button, Card, Divider, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  TitleFieldProps,
} from '@rjsf/utils'
import { ReactNode } from 'react'
import Link from 'src/Link'
import QuestionViewer from 'src/MuiForms/QuestionViewer'
import { getPathFromId, isQuestionAnswered } from 'utils/formUtils'

export function ArrayFieldTemplate({ title, items, canAdd, registry, onAddClick }: ArrayFieldTemplateProps) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography
        variant='h5'
        component='h2'
        sx={{
          fontWeight: 'bold',
        }}
      >
        {title}
      </Typography>
      {canAdd && registry.formContext.editMode && !registry.formContext.mirroredModel && (
        <Button size='small' type='button' onClick={onAddClick} startIcon={<AddIcon />}>
          Add Item
        </Button>
      )}
      {items}
    </Card>
  )
}

export function ArrayFieldItemTemplate({ children, registry, buttonsProps }: ArrayFieldItemTemplateProps) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 11 }}>
        <Box>{children}</Box>
      </Grid>
      <Grid size={{ xs: 1 }}>
        {registry.formContext.editMode && buttonsProps && (
          <Tooltip title='Remove item'>
            <IconButton size='small' type='button' onClick={buttonsProps.onRemoveItem}>
              <CloseIcon color='error' />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
    </Grid>
  )
}

export function DescriptionFieldTemplate() {
  return <></>
}

export function FieldTemplate({ children, registry, schema, id, hidden }: FieldTemplateProps) {
  const theme = useTheme()
  const answered = isQuestionAnswered(id, schema, registry.formContext)
  const requiredByState =
    registry.formContext.requiredByModelState &&
    schema.requiredByModelStates &&
    schema.requiredByModelStates.includes(registry.formContext.requiredByModelState)

  // Objects are skipped so that only the offending leaf is marked
  const invalidMessage =
    schema.type === 'object' ? undefined : registry.formContext.invalidFields?.get(getPathFromId(id).join('.'))

  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>
  }

  // The wrapper renders unmarked too - swapping it out would remount the widget and steal focus
  let marker: ReactNode = null
  let backgroundColour: string | undefined

  if (invalidMessage) {
    backgroundColour = alpha(theme.palette.error.main, 0.1)
    marker = (
      <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
        <Error color='error' fontSize='small' aria-label={`${invalidMessage}: ${schema.title ?? id}`} />
        <Typography variant='caption' color='error'>
          {invalidMessage}
        </Typography>
      </Stack>
    )
  } else if (requiredByState) {
    backgroundColour = alpha(answered ? theme.palette.primary.main : theme.palette.error.main, 0.1)
    marker = (
      <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
        {answered ? (
          <Done
            color='success'
            fontSize='small'
            aria-label={`Answered field required for ${registry.formContext.requiredByModelState}`}
          />
        ) : (
          <Error
            color='error'
            fontSize='small'
            aria-label={`Unanswered field required for ${registry.formContext.requiredByModelState}`}
          />
        )}
        <Typography variant='caption' color={answered ? 'success' : 'error'}>
          {`Required for ${registry.formContext.requiredByModelState}`}
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={0.5} sx={{ backgroundColor: backgroundColour, p: marker ? 1 : 0 }}>
      {marker}
      {children}
    </Stack>
  )
}

export function ErrorListTemplate() {
  return (
    <Typography color='error' sx={{ mb: 2 }}>
      Please make sure that all errors listed below have been resolved.
    </Typography>
  )
}

export function ObjectFieldTemplate({
  title,
  properties,
  description,
  fieldPathId,
  registry,
}: ObjectFieldTemplateProps) {
  return (
    <Box sx={{ p: 2, scrollMarginTop: 100 }} id={fieldPathId.$id}>
      <Stack spacing={2}>
        <div>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <Typography
              variant='h6'
              component='h3'
              sx={{
                fontWeight: 'bold',
              }}
            >
              {title}
            </Typography>
            <Tooltip title='Share'>
              <IconButton
                component={Link}
                href={`#${fieldPathId.$id}`}
                onClick={() => registry.formContext.onShare(fieldPathId.$id)}
                aria-label='Share'
              >
                <Share fontSize='small' color='secondary' />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant='caption'>{description}</Typography>
        </div>
        <Stack style={{ marginLeft: 10 }} spacing={2}>
          {properties.map((element) => (
            <Box key={element.name} className='property-wrapper'>
              {element.content}
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

export function ObjectFieldTemplateForQuestionViewer({
  title,
  properties,
  description,
  registry,
  schema,
  fieldPathId,
}: ObjectFieldTemplateProps) {
  const theme = useTheme()

  const rootName = `${registry.formContext.rootSection}.${fieldPathId.$id.replace('root_', '').replace('_', '.')}`
  const handleOnClick = () => {
    registry.formContext.onClickListener({ path: rootName, schema })
  }

  return (
    <Box
      sx={{
        p: 1,
        ...(registry.formContext.activePath === rootName
          ? {
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: theme.palette.primary.main,
              borderRadius: 1.5,
            }
          : {}),
      }}
    >
      <Stack spacing={2}>
        <Stack>
          <Button size='large' sx={{ textTransform: 'none', textAlign: 'left', width: 'fit-content' }}>
            <Typography
              variant='h6'
              component='h3'
              onClick={handleOnClick}
              sx={{
                fontWeight: 'bold',
              }}
            >
              {title}
            </Typography>
          </Button>
          <Typography variant='caption' sx={{ pl: 1.5 }}>
            {description}
          </Typography>
        </Stack>
        <Box sx={{ px: 2 }}>
          {properties.map((element) => (
            <div key={element.name} className='property-wrapper'>
              {element.content}
            </div>
          ))}
        </Box>
      </Stack>
    </Box>
  )
}

export function TitleFieldTemplate({ title, id }: TitleFieldProps) {
  return id === 'root__title' ? (
    <Typography
      variant='h5'
      sx={{
        fontWeight: 'bold',
      }}
    >
      {title}
    </Typography>
  ) : (
    <Typography
      variant='h6'
      sx={{
        fontWeight: 'bold',
        pt: 2,
      }}
    >
      test {title}
    </Typography>
  )
}

export function GridTemplate(props) {
  const { children, column, className, ...rest } = props
  return (
    <Grid item={column} {...rest} className={`${className} my-custom-grid-styling`}>
      {children}
    </Grid>
  )
}

export function ArrayFieldTemplateForQuestionViewer({ title, registry, schema, fieldPathId }: ArrayFieldTemplateProps) {
  const questions: ReactNode[] = []
  const rootName = `${registry.formContext.rootSection}.${fieldPathId.$id.replace('root_', '').replace('_', '.')}`
  if (typeof schema.items === 'object' && !Array.isArray(schema.items) && schema.items !== null) {
    const schemaQuestions = schema.items['properties']
    for (const question in schemaQuestions) {
      questions.push(
        <QuestionViewer
          schema={schemaQuestions[question] as RJSFSchema}
          registry={registry}
          label={schemaQuestions[question]['title']}
          id={question}
        />,
      )
    }
  }

  const handleOnClick = () => {
    registry.formContext.onClickListener({ path: rootName, schema })
  }

  return (
    <Card sx={{ p: 2 }}>
      <Button size='large' onClick={handleOnClick} sx={{ textTransform: 'none' }}>
        {title}
      </Button>
      <Divider flexItem />
      <Stack sx={{ pt: 2 }} spacing={2}>
        {questions.map((question) => question)}
      </Stack>
    </Card>
  )
}
