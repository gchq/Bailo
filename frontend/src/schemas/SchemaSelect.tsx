import ArrowBack from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Schema from '@mui/icons-material/Schema'
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
import { useGetEntry } from 'actions/entry'
import { postFromSchema } from 'actions/modelCard'
import { useGetSchemas } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import SchemaButton from 'src/schemas/SchemaButton'
import {
  EntryInterface,
  EntryKindLabel,
  SchemaInterface,
  SchemaKind,
  SchemaKindKeys,
  SchemaKindLabel,
} from 'types/types'
import { entryKindForRedirect } from 'utils/routerUtils'

type SchemaSelectDeploymentAssessmentProps = {
  schemaKind: typeof SchemaKind.DEPLOYMENT_ASSESSMENT
  entry?: never
}

type SchemaSelectEntryProps = {
  schemaKind: Exclude<SchemaKindKeys, typeof SchemaKind.DEPLOYMENT_ASSESSMENT>
  entry: EntryInterface
}

type SchemaSelectProps = SchemaSelectDeploymentAssessmentProps | SchemaSelectEntryProps

export default function SchemaSelect({ schemaKind, entry }: SchemaSelectProps) {
  const router = useRouter()
  const [loadingSchemaId, setLoadingSchemaId] = useState<string | null>(null)
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(schemaKind, false)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const { mutateEntry } = useGetEntry(entry?.id, entry?.kind)

  const isLoadingData = useMemo(
    () => isSchemasLoading || isCurrentUserLoading,
    [isCurrentUserLoading, isSchemasLoading],
  )

  const activeSchemas = useMemo(() => schemas.filter((schema) => schema.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((schema) => !schema.active), [schemas])

  const accordionStyling = {
    '&:before': {
      display: 'none',
    },
    width: '100%',
  } as const

  const selectionCallback = useMemo(() => {
    if (schemaKind === SchemaKind.ACCESS_REQUEST) {
      return async (newSchema: SchemaInterface) => {
        setLoadingSchemaId(newSchema.id)
        router.push(`/model/${entry.id}/access-request/new?schemaId=${newSchema.id}`)
      }
    }
    if (schemaKind === SchemaKind.DEPLOYMENT_ASSESSMENT) {
      return async (newSchema: SchemaInterface) => {
        setLoadingSchemaId(newSchema.id)
        router.push(`/deployment-assessments/new?schemaId=${newSchema.id}`)
      }
    }
    return async (newSchema: SchemaInterface) => {
      if (currentUser) {
        setLoadingSchemaId(newSchema.id)

        const response = await postFromSchema(entry.id, newSchema.id)

        if (response.status && response.status < 400) {
          await mutateEntry()
          router.push(`/${entryKindForRedirect(entry.kind)}/${entry.id}`)
        } else {
          setLoadingSchemaId(null)
        }
      }
    }
  }, [schemaKind, entry, currentUser, mutateEntry, router])

  const activeSchemaButtons = useMemo(
    () =>
      activeSchemas.length ? (
        activeSchemas.map((activeSchema) => (
          <SchemaButton
            key={activeSchema.id}
            schema={activeSchema}
            loading={loadingSchemaId === activeSchema.id}
            onClick={() => selectionCallback(activeSchema)}
          />
        ))
      ) : (
        <EmptyBlob text='Could not find any active schemas' />
      ),
    [activeSchemas, selectionCallback, loadingSchemaId],
  )

  const inactiveSchemaButtons = useMemo(
    () =>
      inactiveSchemas.length ? (
        inactiveSchemas.map((inactiveSchema) => (
          <SchemaButton
            key={inactiveSchema.id}
            schema={inactiveSchema}
            loading={loadingSchemaId === inactiveSchema.id}
            onClick={() => selectionCallback(inactiveSchema)}
          />
        ))
      ) : (
        <EmptyBlob text='Could not find any inactive schemas' />
      ),
    [inactiveSchemas, selectionCallback, loadingSchemaId],
  )

  const link = useMemo(() => {
    if (schemaKind === SchemaKind.DEPLOYMENT_ASSESSMENT) {
      return '/deployment-assessments'
    }
    if (schemaKind === SchemaKind.ACCESS_REQUEST) {
      return `/model/${entry.id}`
    }
    return `/${entryKindForRedirect(entry.kind)}/${entry.id}`
  }, [schemaKind, entry])

  const backLabel = useMemo(() => {
    if (schemaKind === SchemaKind.DEPLOYMENT_ASSESSMENT) {
      return 'Back to Deployment Assessments'
    }
    return `Back to ${EntryKindLabel[entry.kind]}`
  }, [schemaKind, entry])

  const error = MultipleErrorWrapper(`Unable to load schema page`, {
    isSchemasError,
    isCurrentUserError,
  })
  if (error) {
    return error
  }

  return (
    <>
      {isLoadingData && <Loading />}
      {schemas && !isLoadingData && (
        <Container maxWidth='md'>
          <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Link href={link}>
              <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                {backLabel}
              </Button>
            </Link>
            <Stack
              spacing={2}
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant='h6' component='h1' color='primary'>
                Select a schema
              </Typography>
              <Schema fontSize='large' color='primary' />
              <Typography>
                Each organisation may have a different set of questions they require you to answer about any
                {` ${SchemaKindLabel[schemaKind]}`} you create. Select from the list below:
              </Typography>
            </Stack>
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                mt: 2,
              }}
            >
              <Accordion defaultExpanded sx={accordionStyling} slotProps={{ heading: { component: 'h2' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ width: '100%' }} align='center' color='primary' variant='h6' component='h3'>
                    Active Schemas
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ m: 2 }}>
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        justifyContent: 'center',
                      }}
                    >
                      {activeSchemaButtons}
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
                  <Stack spacing={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant='caption'>
                        The use of inactive schemas is discouraged as they are deprecated. You may still use them if you
                        have feel you have a valid use-case.
                      </Typography>
                    </Box>
                    <Grid
                      container
                      spacing={2}
                      sx={{
                        justifyContent: 'center',
                      }}
                    >
                      {inactiveSchemaButtons}
                    </Grid>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Paper>
        </Container>
      )}
    </>
  )
}
