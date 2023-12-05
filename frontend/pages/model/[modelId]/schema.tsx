import { Schema } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Card, Container, Grid, Stack, Typography } from '@mui/material'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import SchemaButton from 'src/model/common/SchemaButton'

import { useGetModel } from '../../../actions/model'
import { postFromSchema } from '../../../actions/modelCard'
import { useGetSchemas } from '../../../actions/schema'
import { useGetCurrentUser } from '../../../actions/user'
import EmptyBlob from '../../../src/common/EmptyBlob'
import Loading from '../../../src/common/Loading'
import Wrapper from '../../../src/Wrapper'
import { SchemaInterface } from '../../../types/types'
import { SchemaKind } from '../../../types/v2/types'

export default function NewSchemaSelection() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.Model)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { model, isModelLoading, isModelError, mutateModel } = useGetModel(modelId)

  const isLoading = useMemo(
    () => isSchemasLoading || isModelLoading || isCurrentUserLoading,
    [isCurrentUserLoading, isModelLoading, isSchemasLoading],
  )
  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  async function createModelUsingSchema(newSchema: SchemaInterface) {
    if (currentUser && model) {
      await postFromSchema(model.id, newSchema.id)
      await mutateModel()
      router.push(`/model/${modelId}`)
    }
  }

  const error = MultipleErrorWrapper(`Unable to load schema selection page`, {
    isSchemasError,
    isCurrentUserError,
    isModelError,
  })
  if (error) return error

  return (
    <Wrapper title='Select a schema' page='upload'>
      {isLoading && <Loading />}
      {!isLoading && (
        <Container maxWidth='md'>
          <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Link href={`/model/${modelId}`}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                Back to model
              </Button>
            </Link>
            <Stack spacing={2} justifyContent='center' alignItems='center'>
              <Typography variant='h6' component='h1' color='primary'>
                Choose a schema
              </Typography>
              <Schema fontSize='large' color='primary' />
              <Typography variant='body1'>
                Each organisation may have a different set of questions they require you to answer about any model you
                create. Select from the list below:
              </Typography>
            </Stack>
            <Stack sx={{ mt: 2 }} spacing={2}>
              <Typography color='primary' variant='h6' component='h2'>
                Active Schemas
              </Typography>
              <Grid container spacing={2}>
                {modelId &&
                  activeSchemas.map((activeSchema) => (
                    <SchemaButton
                      key={activeSchema.id}
                      schema={activeSchema}
                      modelId={modelId}
                      onClickAction={() => createModelUsingSchema(activeSchema)}
                    />
                  ))}
                {activeSchemas.length === 0 && <EmptyBlob text='Could not find any active schemas' />}
              </Grid>
              <Typography color='primary' variant='h6' component='h2'>
                Inactive Schemas
              </Typography>
              <Grid container spacing={2}>
                {modelId &&
                  inactiveSchemas.map((inactiveSchema) => (
                    <SchemaButton
                      key={inactiveSchema.id}
                      schema={inactiveSchema}
                      modelId={modelId}
                      onClickAction={() => createModelUsingSchema(inactiveSchema)}
                    />
                  ))}
                {inactiveSchemas.length === 0 && <EmptyBlob text='Could not find any inactive schemas' />}
              </Grid>
            </Stack>
          </Card>
        </Container>
      )}
    </Wrapper>
  )
}
