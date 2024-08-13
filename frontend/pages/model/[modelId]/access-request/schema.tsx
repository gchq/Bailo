import { Schema } from '@mui/icons-material'
import ArrowBack from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import _ from 'lodash-es'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import SchemaButton from 'src/schemas/SchemaButton'
import { SchemaInterface, SchemaKind } from 'types/types'

export default function AccessRequestSchema() {
  const router = useRouter()
  const { modelId }: { modelId?: string } = router.query
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.ACCESS_REQUEST)

  const [loading, setLoading] = useState(false)

  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  const handleSchemaSelectionOnClick = useCallback(
    (newSchema: SchemaInterface) => {
      setLoading(true)
      router.push(`/model/${modelId}/access-request/new?schemaId=${newSchema.id}`)
    },
    [modelId, router],
  )

  const accordionStyling = {
    '&:before': {
      display: 'none',
    },
    width: '100%',
  } as const

  const activeSchemaButtons = useMemo(
    () =>
      activeSchemas.length ? (
        activeSchemas.map((activeSchema) => (
          <SchemaButton
            key={activeSchema.id}
            schema={activeSchema}
            loading={loading}
            onClick={() => handleSchemaSelectionOnClick(activeSchema)}
          />
        ))
      ) : (
        <EmptyBlob text='Could not find any active schemas' />
      ),
    [activeSchemas, handleSchemaSelectionOnClick, loading],
  )

  const inactiveSchemaButtons = useMemo(
    () =>
      inactiveSchemas.length ? (
        inactiveSchemas.map((inactiveSchema) => (
          <SchemaButton
            key={inactiveSchema.id}
            schema={inactiveSchema}
            loading={loading}
            onClick={() => handleSchemaSelectionOnClick(inactiveSchema)}
          />
        ))
      ) : (
        <EmptyBlob text='Could not find any inactive schemas' />
      ),
    [inactiveSchemas, handleSchemaSelectionOnClick, loading],
  )

  const error = MultipleErrorWrapper(`Unable to load schema page`, {
    isSchemasError,
  })
  if (error) return error

  return (
    <>
      <Title text='Select a schema' />
      {isSchemasLoading && <Loading />}
      {schemas && !isSchemasLoading && (
        <Container maxWidth='md'>
          <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
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
            <Stack sx={{ mt: 2 }} spacing={2} alignItems='center'>
              <Accordion defaultExpanded sx={accordionStyling}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ width: '100%' }} align='center' color='primary' variant='h6' component='h2'>
                    Active Schemas
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ m: 2 }}>
                    <Grid container spacing={2} justifyContent='center'>
                      {modelId && activeSchemaButtons}
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>
              <Accordion sx={accordionStyling}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ width: '100%' }} align='center' color='primary' variant='h6' component='h2'>
                    Inactive Schemas
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2} justifyContent='center'>
                    {modelId && inactiveSchemaButtons}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Paper>
        </Container>
      )}
    </>
  )
}
