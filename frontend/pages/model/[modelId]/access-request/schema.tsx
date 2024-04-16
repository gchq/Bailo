import { Schema } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { Box, Button, Card, Container, Grid, Stack, Typography } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import SchemaButton from 'src/model/common/SchemaButton'
import { SchemaInterface, SchemaKind } from 'types/types'

export default function NewSchemaSelection() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.AccessRequest)

  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  async function handleSchemaSelectionOnClick(newSchema: SchemaInterface) {
    router.push(`/model/${modelId}/access-request/new?schemaId=${newSchema.id}`)
  }

  const error = MultipleErrorWrapper(`Unable to load schema page`, {
    isSchemasError,
  })
  if (error) return error

  return (
    <>
      <Title title='Select a schema' />
      {isSchemasLoading && <Loading />}
      {schemas && !isSchemasLoading && (
        <Container maxWidth='md'>
          <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Link href={`/model/${modelId}`}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                Back to model
              </Button>
            </Link>
            <Stack spacing={2} justifyContent='center' alignItems='center'>
              <Typography variant='h6' color='primary'>
                Select a schema
              </Typography>
              <Schema fontSize='large' color='primary' />
              <Typography>
                Each organisation may have a different set of questions they require you to answer about any access
                request you create. Select from the list below:
              </Typography>
            </Stack>
            <Stack sx={{ mt: 2 }} spacing={2}>
              <Typography color='primary' component='h2' variant='h6'>
                Active Schemas
              </Typography>
              <Box sx={{ m: 2 }}>
                <Grid container spacing={2}>
                  {modelId &&
                    activeSchemas.map((activeSchema) => (
                      <SchemaButton
                        key={activeSchema.id}
                        schema={activeSchema}
                        onClick={() => handleSchemaSelectionOnClick(activeSchema)}
                      />
                    ))}
                  {activeSchemas.length === 0 && <EmptyBlob text='Could not find any active schemas' />}
                </Grid>
              </Box>
              <Typography color='primary' component='h2' variant='h6'>
                Inactive Schemas
              </Typography>
              <Grid container spacing={2}>
                {modelId &&
                  inactiveSchemas.map((inactiveSchema) => (
                    <SchemaButton
                      key={inactiveSchema.id}
                      schema={inactiveSchema}
                      onClick={() => handleSchemaSelectionOnClick(inactiveSchema)}
                    />
                  ))}
                {inactiveSchemas.length === 0 && <EmptyBlob text='Could not find any inactive schemas' />}
              </Grid>
            </Stack>
          </Card>
        </Container>
      )}
    </>
  )
}
