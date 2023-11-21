import { Schema } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Card, Container, Grid, Stack, Typography } from '@mui/material'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Link from 'src/Link'

import { useGetSchemas } from '../../../../../actions/schema'
import EmptyBlob from '../../../../../src/common/EmptyBlob'
import Loading from '../../../../../src/common/Loading'
import MessageAlert from '../../../../../src/MessageAlert'
import SchemaButton from '../../../../../src/model/beta/common/SchemaButton'
import Wrapper from '../../../../../src/Wrapper.beta'
import { SchemaKind } from '../../../../../types/v2/types'

export default function NewSchemaSelection() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.AccessRequest)

  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  return (
    <Wrapper title='Select a schema' page='upload'>
      {isSchemasLoading && <Loading />}
      {schemas && !isSchemasLoading && (
        <Container maxWidth='md'>
          <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Link href={`/beta/model/${modelId}?tab=access`}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                Back to model
              </Button>
            </Link>
            <Stack spacing={2} justifyContent='center' alignItems='center'>
              <Typography variant='h6' color='primary'>
                Choose a schema
              </Typography>
              <Schema fontSize='large' color='primary' />
              <Typography>
                Each organisation may have a different set of questions they require you to answer about any access
                request you create. Select from the list below:
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
