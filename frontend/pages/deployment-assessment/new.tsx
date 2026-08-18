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
import { postDeploymentAssessment } from 'actions/deploymentAssessment'
import { useGetSchema, useGetSchemas } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import SchemaButton from 'src/schemas/SchemaButton'
import { SchemaInterface, SchemaKind, SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema, setStepValidate, validateForm } from 'utils/formUtils'

export default function NewDeploymentAssessment() {
  const router = useRouter()
  const { schemaId }: { schemaId?: string } = router.query

  // Schema selection state
  const [schemaSelectionLoading, setSchemaSelectionLoading] = useState(false)
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas(SchemaKind.ACCESS_REQUEST, false)

  // Form state
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [errorText, setErrorText] = useState('')
  const [draftSuccessText, setDraftSuccessText] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const [draftButtonLoading, setDraftButtonLoading] = useState(false)
  const [formValidationErrorState, setFormValidationErrorState] = useState(false)

  const isFormLoading = useMemo(() => isSchemaLoading || isCurrentUserLoading, [isSchemaLoading, isCurrentUserLoading])

  useEffect(() => {
    if (!schema || !currentUser) {
      return
    }

    const steps = getStepsFromSchema(schema, {}, [], {})
    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, currentUser])

  // Schema selection handlers
  const activeSchemas = useMemo(() => schemas.filter((s) => s.active), [schemas])
  const inactiveSchemas = useMemo(() => schemas.filter((s) => !s.active), [schemas])

  const handleSchemaSelect = useCallback(
    (selected: SchemaInterface) => {
      setSchemaSelectionLoading(true)
      router.push(`/deployments/new?schemaId=${selected.id}`)
    },
    [router],
  )

  const accordionStyling = {
    '&:before': { display: 'none' },
    width: '100%',
  } as const

  const activeSchemaButtons = useMemo(
    () =>
      activeSchemas.length ? (
        activeSchemas.map((s) => (
          <SchemaButton key={s.id} schema={s} loading={schemaSelectionLoading} onClick={() => handleSchemaSelect(s)} />
        ))
      ) : (
        <EmptyBlob text='Could not find any active schemas' />
      ),
    [activeSchemas, schemaSelectionLoading, handleSchemaSelect],
  )

  const inactiveSchemaButtons = useMemo(
    () =>
      inactiveSchemas.length ? (
        inactiveSchemas.map((s) => (
          <SchemaButton key={s.id} schema={s} loading={schemaSelectionLoading} onClick={() => handleSchemaSelect(s)} />
        ))
      ) : (
        <EmptyBlob text='Could not find any inactive schemas' />
      ),
    [inactiveSchemas, schemaSelectionLoading, handleSchemaSelect],
  )

  // Form handlers
  async function onSaveDraft() {
    setErrorText('')
    setDraftSuccessText('')
    setDraftButtonLoading(true)

    if (!schemaId) {
      setErrorText('Please wait until the page has finished loading before attempting to save.')
      setDraftButtonLoading(false)
      return
    }

    const data = getStepsData(splitSchema, true)
    const res = await postDeploymentAssessment(schemaId, data, true)

    if (!res.ok) {
      setErrorText(await getErrorMessage(res))
      setDraftButtonLoading(false)
      return
    }

    setDraftSuccessText('Draft saved successfully.')
    setDraftButtonLoading(false)
  }

  async function onSubmit() {
    setErrorText('')
    setDraftSuccessText('')
    setSubmitButtonLoading(true)
    setFormValidationErrorState(false)

    if (!schemaId) {
      setErrorText('Please wait until the page has finished loading before attempting to submit.')
      setSubmitButtonLoading(false)
      return
    }

    for (const step of splitSchema.steps) {
      setStepValidate(splitSchema, setSplitSchema, step, true)
    }

    for (const step of splitSchema.steps) {
      const isValid = validateForm(step)

      if (!isValid) {
        setErrorText('Please make sure that all sections have been completed.')
        setSubmitButtonLoading(false)
        setFormValidationErrorState(true)
        return
      }
    }

    const data = getStepsData(splitSchema, true)
    const res = await postDeploymentAssessment(schemaId, data, false)

    if (!res.ok) {
      setErrorText(await getErrorMessage(res))
      setSubmitButtonLoading(false)
      return
    }

    router.push('/deployments')
  }

  const error = MultipleErrorWrapper('Unable to load deployment assessment page', {
    isSchemasError,
    isSchemaError,
    isCurrentUserError,
  })
  if (error) {
    return error
  }

  // Schema selection view
  if (!schemaId) {
    return (
      <>
        <Title text='Select a schema' />
        {isSchemasLoading && <Loading />}
        {schemas && !isSchemasLoading && (
          <Container maxWidth='md'>
            <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
              <Link href='/deployments'>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to Deployment Assessments
                </Button>
              </Link>
              <Stack spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant='h6' component='h1' color='primary'>
                  Select a schema
                </Typography>
                <Schema fontSize='large' color='primary' />
                <Typography>
                  Each organisation may have a different set of questions they require you to answer about any
                  deployment assessment you create. Select from the list below:
                </Typography>
              </Stack>
              <Stack spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
                <Accordion defaultExpanded sx={accordionStyling} slotProps={{ heading: { component: 'h2' } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ width: '100%' }} align='center' color='primary' variant='h6' component='h3'>
                      Active Schemas
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ m: 2 }}>
                      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
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
                          The use of inactive schemas is discouraged as they are deprecated. You may still use them if
                          you feel you have a valid use-case.
                        </Typography>
                      </Box>
                      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
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

  // Form view
  return (
    <>
      <Title text='New Deployment Assessment' />
      {isFormLoading && <Loading />}
      {!isFormLoading && (
        <Container maxWidth='lg'>
          <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
            <Stack spacing={4}>
              <Link href='/deployments/new'>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Select a different schema
                </Button>
              </Link>
              <JsonSchemaForm
                splitSchema={splitSchema}
                setSplitSchema={setSplitSchema}
                canEdit
                displayLabelValidation={formValidationErrorState}
                defaultCurrentUserInEntityList
              />
              <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
                <Stack direction='row' spacing={2} sx={{ justifyContent: 'flex-end' }}>
                  <Button
                    sx={{ width: 'fit-content' }}
                    variant='outlined'
                    onClick={onSaveDraft}
                    loading={draftButtonLoading}
                    disabled={submitButtonLoading}
                    data-test='saveDraftDeploymentAssessmentButton'
                  >
                    Save draft
                  </Button>
                  <Button
                    sx={{ width: 'fit-content' }}
                    variant='contained'
                    onClick={onSubmit}
                    loading={submitButtonLoading}
                    disabled={draftButtonLoading}
                    data-test='createDeploymentAssessmentButton'
                  >
                    Submit
                  </Button>
                </Stack>
                <MessageAlert message={errorText} severity='error' />
                <MessageAlert message={draftSuccessText} severity='success' />
              </Stack>
            </Stack>
          </Paper>
        </Container>
      )}
    </>
  )
}
