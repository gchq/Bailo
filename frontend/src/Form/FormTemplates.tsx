import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Card, Grid2, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { ArrayFieldTemplateProps, ObjectFieldTemplateProps } from '@rjsf/utils'

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography fontWeight='bold' variant='h5' component='h3'>
        {props.title}
      </Typography>
      {props.items.map((element) => (
        <Grid2 key={element.key} container spacing={2}>
          <Grid2 size={{ xs: 11 }}>
            <Box>{element.children}</Box>
          </Grid2>
          <Grid2 size={{ xs: 1 }}>
            {props.formContext.editMode && (
              <Tooltip title='Remove item'>
                <IconButton size='small' type='button' onClick={element.onDropIndexClick(element.index)}>
                  <CloseIcon color='error' />
                </IconButton>
              </Tooltip>
            )}
          </Grid2>
        </Grid2>
      ))}
      {props.canAdd && props.formContext.editMode && (
        <Button size='small' type='button' onClick={props.onAddClick} startIcon={<AddIcon />}>
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
