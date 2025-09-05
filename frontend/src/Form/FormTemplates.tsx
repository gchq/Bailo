import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Card, Divider, Grid2, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { ArrayFieldTemplateProps, ObjectFieldTemplateProps, TitleFieldProps } from '@rjsf/utils'
import { ReactNode } from 'react'
import QuestionViewer from 'src/MuiForms/QuestionViewer'

export function ArrayFieldTemplate({ title, items, canAdd, formContext, onAddClick }: ArrayFieldTemplateProps) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography fontWeight='bold' variant='h5' component='h3'>
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

export function ArrayFieldViewerTemplate({ title, formContext, schema, ...props }: ArrayFieldTemplateProps) {
  const questions: ReactNode[] = []
  const rootName = `${formContext.rootSection}.${props.idSchema.$id.replace('root_', '')}`
  if (schema.items) {
    const schemaQuestions = schema.items['properties']
    for (const question in schemaQuestions) {
      questions.push(
        <QuestionViewer
          schema={schemaQuestions[question]}
          formContext={{ ...formContext, rootSection: rootName }}
          label={schemaQuestions[question].title}
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
