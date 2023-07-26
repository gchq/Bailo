import { Schema } from '@mui/icons-material'
import { Button, Card, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'

import Wrapper from '../../../../src/Wrapper.beta'

export default function NewSchemaSelection() {
  const router = useRouter()
  const { modelUuid }: { modelUuid?: string } = router.query
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

  function createModelUsingSchema(_schema: string) {
    router.push(`/beta/model/${modelUuid}`)
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
    <Wrapper title='Select a schema' page='upload'>
      <Card sx={{ maxWidth: '750px', mx: 'auto', my: 4, p: 4 }}>
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
      </Card>
    </Wrapper>
  )
}
