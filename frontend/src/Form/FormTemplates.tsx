import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import Error from '@mui/icons-material/ErrorOutlineOutlined'
import Share from '@mui/icons-material/Share'
import { Box, Button, ButtonBase, Card, Divider, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  ErrorListProps,
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  RJSFValidationError,
  TitleFieldProps,
} from '@rjsf/utils'
import { ReactNode } from 'react'
import Link from 'src/Link'
import QuestionViewer from 'src/MuiForms/QuestionViewer'
import { getFieldId, getQuestionTitle, isQuestionAnswered, sortFormErrors } from 'utils/formUtils'

function FieldErrors({ rawErrors }: { rawErrors?: string[] }) {
  if (!rawErrors || rawErrors.length === 0) {
    return null
  }

  // Ensure multiple errors are always in the same order
  const sortedErrors = [...rawErrors].sort((a, b) => a.localeCompare(b))

  return (
    <Stack spacing={0.5}>
      {sortedErrors.map((error, index) => (
        <Stack key={`${error}-${index}`} direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
          <Error color='error' fontSize='small' />
          <Typography color='error' variant='body2'>
            {error}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}

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

export function FieldTemplate({ children, registry, schema, id, rawErrors }: FieldTemplateProps) {
  const theme = useTheme()
  const answered = isQuestionAnswered(id, schema, registry.formContext)
  const requiredByState =
    registry.formContext.requiredByModelState &&
    schema.requiredByModelStates &&
    schema.requiredByModelStates.includes(registry.formContext.requiredByModelState)
  const hasErrors = !!rawErrors && rawErrors.length > 0

  // Always render the wrapper so that showing/hiding an error does not lose focus while typing
  const content = (
    <Stack
      spacing={0.5}
      data-field-anchor={id}
      sx={{
        scrollMarginTop: 100,
        ...(hasErrors ? { backgroundColor: alpha(theme.palette.error.main, 0.1), p: 1 } : {}),
      }}
    >
      <FieldErrors rawErrors={rawErrors} />
      {children}
    </Stack>
  )

  if (requiredByState) {
    return (
      <Stack
        spacing={0.5}
        sx={{
          backgroundColor: alpha(answered ? theme.palette.primary.main : theme.palette.error.main, 0.1),
          p: 1,
        }}
      >
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
        {content}
      </Stack>
    )
  }

  return <>{content}</>
}

function formatErrorListItem(error: RJSFValidationError, schema: RJSFSchema) {
  // Errors raised by a custom validator have no title of their own, so it is looked up from the schema
  const title = error.title || getQuestionTitle(schema, error.property)

  return title ? `${title}: ${error.message}` : error.message
}

function scrollToField(property?: string) {
  const fieldId = getFieldId(property)
  const anchor = document.querySelector(`[data-field-anchor="${fieldId}"]`)

  anchor?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  // Widgets render the field id on their input, so the question can be focused
  document.getElementById(fieldId)?.focus({ preventScroll: true })
}

export function ErrorListTemplate({ errors, schema }: ErrorListProps) {
  return (
    <Stack spacing={0.5} sx={{ mb: 2 }}>
      <Typography color='error' sx={{ fontWeight: 'bold' }}>
        Please resolve the following errors
      </Typography>
      {sortFormErrors(errors, schema).map((error, index) => (
        <ButtonBase
          key={`${error.stack}-${index}`}
          onClick={() => scrollToField(error.property)}
          sx={{ justifyContent: 'flex-start', textAlign: 'left', width: 'fit-content' }}
          data-test='formErrorListItem'
        >
          <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
            <Error color='error' fontSize='small' />
            <Typography color='error' variant='body2' sx={{ textDecoration: 'underline' }}>
              {formatErrorListItem(error, schema)}
            </Typography>
          </Stack>
        </ButtonBase>
      ))}
    </Stack>
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
