import { PostAdd, Schema } from '@mui/icons-material'
import { Box, Button, Divider, Grid, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

export default function Overview() {
  const [showTemplatePage, setShowTemplatePage] = useState(false)
  const [showSchemaPage, setShowSchemaPage] = useState(false)
  const [showFormPage, setShowFormPage] = useState(false)
  const [model, setModel] = useState<any>({})

  useEffect(() => {
    if (model.schema === undefined) {
      setShowTemplatePage(true)
    } else {
      setShowTemplatePage(false)
      setShowSchemaPage(false)
      setShowFormPage(true)
    }
  }, [model])

  function createFromScratchOnClick() {
    setShowTemplatePage(false)
    setShowSchemaPage(true)
  }

  function createModelUsingSchema(schema: string) {
    setModel({
      schema: schema,
    })
    setShowSchemaPage(false)
    setShowFormPage(true)
  }

  function schemaButton(schema: any) {
    return (
      <Button variant='outlined' size='large' onClick={() => createModelUsingSchema(schema)}>
        <Stack>
          <Typography variant='button'>{schema.title}</Typography>
          <Typography variant='caption'>{schema.description}</Typography>
        </Stack>
      </Button>
    )
  }
  return (
    <>
      {showTemplatePage && (
        <Box sx={{ maxWidth: '750px', mx: 'auto', my: 4 }}>
          <Stack spacing={2} justifyContent='center' alignItems='center'>
            <Typography variant='h6' color='primary'>
              Create a model card
            </Typography>
            <PostAdd fontSize='large' color='primary' />
            <Typography variant='body1'>
              Model cards are required to ensure that our models are ethical, secure and effective. A model card is a
              living document, it lives with your code and will evolve over time.
            </Typography>
            <Stack
              direction='row'
              spacing={2}
              justifyContent='center'
              alignItems='center'
              divider={<Divider orientation='vertical' flexItem />}
            >
              <Button variant='contained' disabled>
                Create from a template...
              </Button>
              <Button variant='contained' onClick={createFromScratchOnClick}>
                Create from scratch...
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}
      {showSchemaPage && (
        <>
          <Box sx={{ maxWidth: '750px', mx: 'auto', my: 4 }}>
            <Stack spacing={2} justifyContent='center' alignItems='center'>
              <Typography variant='h6' color='primary'>
                Choose a schema
              </Typography>
              <Schema fontSize='large' color='primary' />
              <Typography variant='body1'>
                Each organisation may have a different set of questions they require yoy to answer about any model you
                create. Select from the list below:
              </Typography>
            </Stack>
            <Stack sx={{ mt: 2 }} spacing={2}>
              <Typography variant='h6'>Active Schemas</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  {schemaButton({
                    title: 'Minimal Schema v1',
                    description: 'This is a test schema',
                    id: 'minimal-schema-v1',
                  })}
                </Grid>
                <Grid item xs={4}>
                  {schemaButton({
                    title: 'Minimal Schema v1',
                    description: 'This is a test schema',
                    id: 'minimal-schema-v1',
                  })}
                </Grid>
              </Grid>
              <Typography variant='h6'>Inactive Schemas</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  {schemaButton({
                    title: 'Minimal Schema v1',
                    description: 'This is a test schema',
                    id: 'minimal-schema-v1',
                  })}
                </Grid>
                <Grid item xs={4}>
                  {schemaButton({
                    title: 'Minimal Schema v1',
                    description: 'This is a test schema',
                    id: 'minimal-schema-v1',
                  })}
                </Grid>
              </Grid>
            </Stack>
          </Box>
        </>
      )}
      {showFormPage && <></>}
    </>
  )
}
