import { Schema } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Card, Container, Grid, Stack, Tooltip, Typography } from '@mui/material'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Link from 'src/Link'

import { useGetModel } from '../../../../actions/model'
import { postFromSchema } from '../../../../actions/modelCard'
import { useGetSchemas } from '../../../../actions/schema'
import { useGetCurrentUser } from '../../../../actions/user'
import EmptyBlob from '../../../../src/common/EmptyBlob'
import Loading from '../../../../src/common/Loading'
import MessageAlert from '../../../../src/MessageAlert'
import Wrapper from '../../../../src/Wrapper.beta'
import { SchemaInterface } from '../../../../types/types'
import { SchemaKind } from '../../../../types/v2/types'

export default function NewSchemaSelection() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.Model)

  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  return (
    <Wrapper title='Select a schema' page='upload'>
      {isSchemasLoading && <Loading />}
      {schemas && !isSchemasLoading && !isSchemasError && (
        <Container maxWidth='md'>
          <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Link href={`/beta/model/${modelId}`}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                Back to model
              </Button>
            </Link>
            <Stack spacing={2} justifyContent='center' alignItems='center'>
              <Typography variant='h6' color='primary'>
                Choose a schema
              </Typography>
              <Schema fontSize='large' color='primary' />
              <Typography variant='body1'>
                Each organisation may have a different set of questions they require you to answer about any model you
                create. Select from the list below:
              </Typography>
            </Stack>
            <Stack sx={{ mt: 2 }} spacing={2}>
              <Typography color='primary' variant='h6'>
                Active Schemas
              </Typography>
              <Grid container spacing={2}>
                {modelId &&
                  activeSchemas.map((activeSchema) => (
                    <SchemaButton key={activeSchema.id} schema={activeSchema} modelId={modelId} />
                  ))}
                {activeSchemas.length === 0 && <EmptyBlob text='Could not find any active schemas' />}
              </Grid>
              <Typography color='primary' variant='h6'>
                Inactive Schemas
              </Typography>
              <Grid container spacing={2}>
                {modelId &&
                  inactiveSchemas.map((inactiveSchema) => (
                    <SchemaButton key={inactiveSchema.id} schema={inactiveSchema} modelId={modelId} />
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

interface SchemaButtonProps {
  modelId: string
  schema: any
}

function SchemaButton({ modelId, schema }: SchemaButtonProps) {
  const { model, isModelLoading, isModelError, mutateModel } = useGetModel(modelId)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const router = useRouter()

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  async function createModelUsingSchema(newSchema: SchemaInterface) {
    if (currentUser && model) {
      await postFromSchema(model.id, newSchema.id)
      await mutateModel()
      router.push(`/beta/model/${modelId}`)
    }
  }

  return (
    <>
      {(isModelLoading || isCurrentUserLoading) && <Loading />}
      <Grid item md={4} sm={12}>
        <Tooltip title={schema.description}>
          <Button
            sx={{ width: '200px', height: '60px' }}
            variant='outlined'
            size='large'
            onClick={() => createModelUsingSchema(schema)}
          >
            <Stack sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Typography variant='button'>{schema.name}</Typography>
              <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} variant='caption'>
                {schema.description}
              </Typography>
            </Stack>
          </Button>
        </Tooltip>
      </Grid>
    </>
  )
}
