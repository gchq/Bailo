import dayjs from '@dayjs'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Paper, Stack, Typography } from '@mui/material'
import { AccessRequestGroupResult, postAccessRequest, postAccessRequestGroup } from 'actions/accessRequest'
import { useGetModel } from 'actions/entry'
import { useGetSchema } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import AccessRequestModels from 'src/entry/model/accessRequests/AccessRequestModels'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { SplitSchemaNoRender } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsData, getStepsFromSchema, setStepValidate, validateForm } from 'utils/formUtils'

export default function NewAccessRequest() {
  const router = useRouter()

  const { modelId, schemaId }: { modelId?: string; schemaId?: string } = router.query
  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(modelId)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [submissionErrorText, setSubmissionErrorText] = useState('')
  const [additionalModelIds, setAdditionalModelIds] = useState<string[]>([])
  const [groupResult, setGroupResult] = useState<AccessRequestGroupResult>()
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const [formValidationErrorState, setFormValidationErrorState] = useState(false)

  useEffect(() => {
    setAdditionalModelIds([])
    setGroupResult(undefined)
  }, [modelId, schemaId])

  const isLoading = useMemo(
    () => isSchemaLoading || isModelLoading || isCurrentUserLoading,
    [isModelLoading, isSchemaLoading, isCurrentUserLoading],
  )

  useEffect(() => {
    if (!model || !schema || !currentUser) {
      return
    }

    const defaultState = {
      overview: {
        entities: [`user:${currentUser.dn}`],
        endDate: dayjs(new Date()).format('YYYY-MM-DD').toString(),
      },
    }
    const steps = getStepsFromSchema(schema, {}, [], defaultState)
    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, model, currentUser])

  async function onSubmit() {
    if (submitButtonLoading || groupResult) {
      return
    }
    setSubmissionErrorText('')
    setSubmitButtonLoading(true)
    setFormValidationErrorState(false)

    if (!modelId || !schemaId) {
      setSubmissionErrorText(`Please wait until the page has finished loading before attempting to submit.`)
      setSubmitButtonLoading(false)
      return
    }

    for (const step of splitSchema.steps) {
      // The user has tried to submit, so let's enable schema validation for each page
      setStepValidate(splitSchema, setSplitSchema, step, true)
    }

    for (const step of splitSchema.steps) {
      const isValid = validateForm(step)

      if (!isValid) {
        setSubmissionErrorText('Please make sure that all sections have been completed.')
        setSubmitButtonLoading(false)
        setFormValidationErrorState(true)
        return
      }
    }

    const data = getStepsData(splitSchema, true)

    if (data.overview.entities.length === 0) {
      setSubmissionErrorText('You must add at least one contact to this access request.')
      setSubmitButtonLoading(false)
      return
    }
    try {
      const res = additionalModelIds.length
        ? await postAccessRequestGroup([modelId, ...additionalModelIds], schemaId, data)
        : await postAccessRequest(modelId, schemaId, data)
      if (!res.ok) {
        setSubmissionErrorText(await getErrorMessage(res))
        return
      }
      const body = await res.json()
      if (additionalModelIds.length) {
        setGroupResult(body)
      } else {
        router.push(`/model/${modelId}/access-request/${body.accessRequest.id}`)
      }
    } catch {
      setSubmissionErrorText(
        'The request status could not be confirmed. Check your existing access requests before submitting again.',
      )
    } finally {
      setSubmitButtonLoading(false)
    }
  }

  const error = MultipleErrorWrapper(`Unable to load access request page`, {
    isModelError,
    isSchemaError,
    isCurrentUserError,
  })
  if (error) {
    return error
  }

  return (
    <>
      <Title text='Access Request' />
      {isLoading && <Loading />}
      {!isLoading && (
        <Container maxWidth='lg'>
          <Paper sx={{ mx: 'auto', my: 4, p: 4 }}>
            {(!model || !model.card) && (
              <Typography>Access requests can not be requested if a schema is not set for this model.</Typography>
            )}
            {model && model.card && (
              <Stack spacing={4}>
                <Link href={`/model/${modelId}/access-request/schema`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Select a different schema
                  </Button>
                </Link>
                <AccessRequestModels
                  modelId={model.id}
                  selectedIds={additionalModelIds}
                  onChange={setAdditionalModelIds}
                  disabled={submitButtonLoading || !!groupResult}
                />
                <JsonSchemaForm
                  splitSchema={splitSchema}
                  setSplitSchema={setSplitSchema}
                  canEdit
                  displayLabelValidation={formValidationErrorState}
                  defaultCurrentUserInEntityList
                />
                <Stack
                  sx={{
                    alignItems: 'flex-end',
                  }}
                >
                  <Button
                    sx={{ width: 'fit-content' }}
                    variant='contained'
                    onClick={onSubmit}
                    loading={submitButtonLoading}
                    disabled={!!groupResult}
                    data-test='createAccessRequestButton'
                  >
                    Submit
                  </Button>
                  <MessageAlert message={submissionErrorText} severity='error' />
                  {groupResult && (
                    <Stack spacing={1} sx={{ width: '100%' }}>
                      <Typography component='h2' variant='h6'>
                        Access request results
                      </Typography>
                      <Typography>
                        {groupResult.accessRequests.length} requests created. Each request requires its own review.
                      </Typography>
                      {groupResult.accessRequests.map((request) => (
                        <Link key={request.id} href={`/model/${request.modelId}/access-request/${request.id}`}>
                          View request for {request.modelId}
                        </Link>
                      ))}
                      {groupResult.failedModelIds.length > 0 && (
                        <MessageAlert
                          message={`No request was created for: ${groupResult.failedModelIds.join(', ')}. Successful requests remain saved. Start a new request for the unsuccessful models only.`}
                          severity='warning'
                        />
                      )}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            )}
          </Paper>
        </Container>
      )}
    </>
  )
}
