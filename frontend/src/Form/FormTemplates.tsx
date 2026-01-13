import { Share } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Card, Divider, Grid, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  TitleFieldProps,
} from '@rjsf/utils'
import { ReactNode } from 'react'
import Link from 'src/Link'
import QuestionViewer from 'src/MuiForms/QuestionViewer'

export function ArrayFieldTemplate({ title, items, canAdd, registry, onAddClick }: ArrayFieldTemplateProps) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography fontWeight='bold' variant='h5' component='h2'>
        {title}
      </Typography>
      {canAdd && registry.formContext.editMode && (
        <Button size='small' type='button' onClick={onAddClick} startIcon={<AddIcon />} sx={{ width: 'fit-content' }}>
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
          <Stack direction='row' alignItems='center' spacing={1}>
            <Typography fontWeight='bold' variant='h6' component='h3'>
              {title}
            </Typography>
            <Tooltip title='Share'>
              <Link href={`#${fieldPathId.$id}`} onClick={() => registry.formContext.onShare(fieldPathId.$id)}>
                <IconButton>
                  <Share fontSize='small' color='secondary' />
                </IconButton>
              </Link>
            </Tooltip>
          </Stack>
          <Typography variant='caption'>{description}</Typography>
        </div>
        <div style={{ marginLeft: 10 }}>
          {properties.map((element) => (
            <div key={element.name} className='property-wrapper'>
              {element.content}
            </div>
          ))}
        </div>
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
            <Typography fontWeight='bold' variant='h6' component='h3' onClick={handleOnClick}>
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
    <Typography variant='h5' fontWeight='bold'>
      {title}
    </Typography>
  ) : (
    <Typography variant='h6' fontWeight='bold' sx={{ pt: 2 }}>
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
