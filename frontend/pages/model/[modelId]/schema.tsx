import { Schema } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Card, Container, Grid, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { postFromSchema } from 'actions/modelCard'
import { useGetSchemas } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import SchemaButton from 'src/entry/model/common/SchemaButton'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { SchemaInterface, SchemaKind } from 'types/types'

export default function NewSchemaSelection() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.Model)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { model, isModelLoading, isModelError, mutateModel } = useGetModel(modelId)

  const isLoadingData = useMemo(
    () => isSchemasLoading || isModelLoading || isCurrentUserLoading,
    [isCurrentUserLoading, isModelLoading, isSchemasLoading],
  )
  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  async function createModelUsingSchema(newSchema: SchemaInterface) {
    if (currentUser && model) {
      setLoading(true)
      setErrorMessage('')

      const response = await postFromSchema(model.id, newSchema.id)

      if (response.status && response.status < 400) {
        await mutateModel()
        router.push(`/model/${modelId}`)
      } else {
        setErrorMessage(response.data)
        setLoading(false)
      }
    }
  }

  const error = MultipleErrorWrapper(`Unable to load schema selection page`, {
    isSchemasError,
    isCurrentUserError,
    isModelError,
  })
  if (error) return error

  return (
    <>
      <Title text='Select a schema' />
      {isLoadingData && <Loading />}
      {!isLoadingData && (
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
                      loading={loading}
                      onClick={() => createModelUsingSchema(activeSchema)}
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
                      loading={loading}
                      onClick={() => createModelUsingSchema(inactiveSchema)}
                    />
                  ))}
                {inactiveSchemas.length === 0 && <EmptyBlob text='Could not find any inactive schemas' />}
              </Grid>
              <MessageAlert message={errorMessage} severity='error' />
            </Stack>
          </Card>
        </Container>
      )}
    </>
  )
}
