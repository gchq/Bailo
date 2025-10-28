import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Card, Divider, Grid2, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrayFieldTemplateProps, ObjectFieldTemplateProps, RJSFSchema, TitleFieldProps } from '@rjsf/utils'
import { ReactNode } from 'react'
import QuestionViewer from 'src/MuiForms/QuestionViewer'

export function ArrayFieldTemplate({ title, items, canAdd, formContext, onAddClick }: ArrayFieldTemplateProps) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography fontWeight='bold' variant='h5' component='h2'>
        {title}
      </Typography>
      {items.map((element) => (
        <Grid2 key={element.key} container spacing={2}>
          <Grid2 size={{ xs: 11 }}>
            <Box>{element.children}</Box>
          </Grid2>
          <Grid2 size={{ xs: 1 }}>
            {formContext.editMode && (
              <Tooltip title='Remove item'>
                <IconButton size='small' type='button' onClick={element.onDropIndexClick(element.index)}>
                  <CloseIcon color='error' />
                </IconButton>
              </Tooltip>
            )}
          </Grid2>
        </Grid2>
      ))}
      {canAdd && formContext.editMode && (
        <Button size='small' type='button' onClick={onAddClick} startIcon={<AddIcon />}>
          Add Item
        </Button>
      )}
    </Card>
  )
}

export function DescriptionFieldTemplate() {
  return <></>
}

export function ObjectFieldTemplate({ title, properties, description }: ObjectFieldTemplateProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <div>
          <Typography fontWeight='bold' variant='h6' component='h3'>
            {title}
          </Typography>
          <Typography variant='caption'>{description}</Typography>
        </div>
        {properties.map((element) => (
          <div key={element.name} className='property-wrapper'>
            {element.content}
          </div>
        ))}
      </Stack>
    </Box>
  )
}

export function ObjectFieldTemplateForQuestionViewer({
  title,
  properties,
  description,
  formContext,
  schema,
  ...props
}: ObjectFieldTemplateProps) {
  const theme = useTheme()

  const rootName = `${formContext.rootSection}.${props.idSchema.$id.replace('root_', '').replace('_', '.')}`
  const handleOnClick = () => {
    formContext.onClickListener({ path: rootName, schema })
  }

  return (
    <Box
      sx={{
        p: 1,
        ...(formContext.activePath === rootName
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
    <Typography variant='h6' fontWeight='bold'>
      {title}
    </Typography>
  )
}

export function GridTemplate(props) {
  const { children, column, className, ...rest } = props
  return (
    <Grid2 item={column} {...rest} className={`${className} my-custom-grid-styling`}>
      {children}
    </Grid2>
  )
}

export function ArrayFieldTemplateForQuestionViewer({ title, formContext, schema, ...props }: ArrayFieldTemplateProps) {
  const questions: ReactNode[] = []
  const rootName = `${formContext.rootSection}.${props.idSchema.$id.replace('root_', '').replace('_', '.')}`
  if (typeof schema.items === 'object' && !Array.isArray(schema.items) && schema.items !== null) {
    const schemaQuestions = schema.items['properties']
    for (const question in schemaQuestions) {
      questions.push(
        <QuestionViewer
          schema={schemaQuestions[question] as RJSFSchema}
          formContext={{ ...formContext, rootSection: rootName }}
          label={schemaQuestions[question]['title']}
          id={question}
        />,
      )
    }
  }

  const handleOnClick = () => {
    formContext.onClickListener({ path: rootName, schema })
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
