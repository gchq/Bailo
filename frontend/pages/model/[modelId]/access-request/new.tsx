import ArrowBack from '@mui/icons-material/ArrowBack'
import { LoadingButton } from '@mui/lab'
import { Button, Card, Container, Stack, Typography } from '@mui/material'
import { postAccessRequest } from 'actions/accessRequest'
import { useGetModel } from 'actions/model'
import { useGetSchema } from 'actions/schema'
import { useGetCurrentUser } from 'actions/user'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
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
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [submissionErrorText, setSubmissionErrorText] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)

  const isLoading = useMemo(
    () => isSchemaLoading || isModelLoading || isCurrentUserLoading,
    [isModelLoading, isSchemaLoading, isCurrentUserLoading],
  )

  useEffect(() => {
    if (!model || !schema || !currentUser) return

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
    setSubmissionErrorText('')
    setSubmitButtonLoading(true)

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
        return
      }
    }

    const data = getStepsData(splitSchema, true)

    if (data.overview.entities.length === 0) {
      setSubmissionErrorText('You must add at least one contact to this access request.')
      setSubmitButtonLoading(false)
      return
    }
    const res = await postAccessRequest(modelId, schemaId, data)

    if (!res.ok) {
      setSubmissionErrorText(await getErrorMessage(res))
      setSubmitButtonLoading(false)
      return
    }

    setSubmitButtonLoading(false)

    const body = await res.json()
    router.push(`/model/${modelId}/access-request/${body.accessRequest.id}`)
  }

  const error = MultipleErrorWrapper(`Unable to load access request page`, {
    isModelError,
    isSchemaError,
    isCurrentUserError,
  })
  if (error) return error

  return (
    <>
      <Title title='Access Request' />
      {isLoading && <Loading />}
      {!isLoading && (
        <Container maxWidth='md'>
          <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
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
                <JsonSchemaForm
                  splitSchema={splitSchema}
                  setSplitSchema={setSplitSchema}
                  canEdit
                  displayLabelValidation
                  defaultCurrentUserInEntityList
                />
                <Stack alignItems='flex-end'>
                  <LoadingButton
                    sx={{ width: 'fit-content' }}
                    variant='contained'
                    onClick={onSubmit}
                    loading={submitButtonLoading}
                    data-test='createAccessRequestButton'
                  >
                    Submit
                  </LoadingButton>
                  <MessageAlert message={submissionErrorText} severity='error' />
                </Stack>
              </Stack>
            )}
          </Card>
        </Container>
      )}
    </>
  )
}
