import { Schema } from '@mui/icons-material'
import { Button, Card, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useGetSchemas } from '../../../../actions/schema'
import EmptyBlob from '../../../../src/common/EmptyBlob'
import Loading from '../../../../src/common/Loading'
import Wrapper from '../../../../src/Wrapper.beta'

export default function NewSchemaSelection() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  function createModelUsingSchema(_schema: string) {
    router.push(`/beta/model/${modelId}`)
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
      {isSchemasLoading && <Loading />}
      {schemas && !isSchemasLoading && !isSchemasError && (
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
              {activeSchemas.map((activeSchema) => {
                return schemaButton({
                  title: activeSchema.name,
                  description: activeSchema.display,
                })
              })}
              {activeSchemas.length === 0 && <EmptyBlob text='Could not find any active schemas' />}
            </Grid>
            <Typography color='primary' variant='h6'>
              Inactive Schemas
            </Typography>
            <Grid container spacing={2}>
              {inactiveSchemas.map((activeSchema) => {
                return schemaButton({
                  title: activeSchema.name,
                  description: activeSchema.display,
                })
              })}
              {inactiveSchemas.length === 0 && <EmptyBlob text='Could not find any inactive schemas' />}
            </Grid>
          </Stack>
        </Card>
      )}
    </Wrapper>
  )
}
