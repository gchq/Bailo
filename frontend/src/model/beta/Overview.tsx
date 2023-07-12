import { ArrowBackIos, PostAdd, Schema } from '@mui/icons-material'
import { Box, Button, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

export default function Overview() {
  const [showTemplatePage, setShowTemplatePage] = useState(false)
  const [showSchemaPage, setShowSchemaPage] = useState(false)
  const [showFormPage, setShowFormPage] = useState(false)
  const [model, setModel] = useState<any>({})
  const [schemas, _setSchemas] = useState<any>([
    {
      id: 'minimal_schema_v1',
      title: 'Minimal Schema V1',
      description: 'This is a test schema',
      inactive: false,
    },
    {
      id: 'minimal_schema_v2',
      title: 'Minimal Schema V2',
      description: 'This is a test schema with an extra long description!',
      inactive: false,
    },
    {
      id: 'minimal_schema_v3',
      title: 'Minimal Schema V3',
      description: 'This is a third test schema',
      inactive: false,
    },
    {
      id: 'inactive_schema_v1',
      title: 'Inactive Schema V1',
      description: 'This schema is no longer active',
      inactive: true,
    },
  ])

  useEffect(() => {
    if (model.schema === undefined) {
      displayTemplatePage()
    } else {
      displayFormPage()
    }
  }, [model])

  function createFromScratchOnClick() {
    displaySchemaPage()
  }

  function displayTemplatePage() {
    setShowTemplatePage(true)
    setShowSchemaPage(false)
    setShowFormPage(false)
  }

  function displaySchemaPage() {
    setShowTemplatePage(false)
    setShowSchemaPage(true)
    setShowFormPage(false)
  }

  function displayFormPage() {
    setShowTemplatePage(false)
    setShowSchemaPage(false)
    setShowFormPage(true)
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
      <Grid item md={4} sm={12}>
        <Tooltip title={schema.description}>
          <Button
            sx={{ width: '200px', height: '60px' }}
            variant='outlined'
            size='large'
            onClick={() => createModelUsingSchema(schema)}
          >
            <Stack sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Typography variant='button'>{schema.title}</Typography>
              <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} variant='caption'>
                {schema.description}
              </Typography>
            </Stack>
          </Button>
        </Tooltip>
      </Grid>
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
            <Button aria-label='back to template selection' startIcon={<ArrowBackIos />} onClick={displayTemplatePage}>
              Back
            </Button>
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
              <Typography color='primary' variant='h6'>
                Active Schemas
              </Typography>
              <Grid container spacing={2}>
                {schemas
                  .filter((schema: any) => !schema.inactive)
                  .map((activeSchema) => {
                    return schemaButton({
                      title: activeSchema.title,
                      description: activeSchema.description,
                    })
                  })}
              </Grid>
              <Typography color='primary' variant='h6'>
                Inactive Schemas
              </Typography>
              <Grid container spacing={2}>
                {schemas
                  .filter((schema: any) => schema.inactive)
                  .map((activeSchema) => {
                    return schemaButton({
                      title: activeSchema.title,
                      description: activeSchema.description,
                    })
                  })}
              </Grid>
            </Stack>
          </Box>
        </>
      )}
      {showFormPage && <>This is the model overview page</>}
    </>
  )
}
