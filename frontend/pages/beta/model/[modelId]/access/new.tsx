import ArrowBack from '@mui/icons-material/ArrowBack'
import { LoadingButton } from '@mui/lab'
import { Button, Card, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { postAccessRequest } from '../../../../../actions/access'
import { useGetModel } from '../../../../../actions/model'
import { useGetSchema } from '../../../../../actions/schema'
import Loading from '../../../../../src/common/Loading'
import ModelCardForm from '../../../../../src/Form/beta/ModelCardForm'
import MessageAlert from '../../../../../src/MessageAlert'
import Wrapper from '../../../../../src/Wrapper.beta'
import { SplitSchemaNoRender } from '../../../../../types/interfaces'
import { getStepsData, getStepsFromSchema, setStepValidate, validateForm } from '../../../../../utils/beta/formUtils'

export default function NewAccessRequest() {
  const router = useRouter()
  const theme = useTheme()

  const { modelId, schemaId }: { modelId?: string; schemaId?: string } = router.query
  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(schemaId || '')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })
  const [submissionErrorText, setSubmissionErrorText] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)

  // TODO - we can probably improve this with a useMemo to stop currentUser causing the useEffect below to re-render
  const currentUserId = (currentUser && currentUser.id) || ''

  useEffect(() => {
    if (!model || !schema) return
    const defaultState = {
      overview: { entities: [currentUserId] },
    }
    const steps = getStepsFromSchema(schema, {}, [], defaultState)
    for (const step of steps) {
      step.steps = steps
    }

    setSplitSchema({ reference: schema.id, steps })
  }, [schema, model, currentUserId])

  async function onSubmit() {
    setSubmissionErrorText('')
    setSubmitButtonLoading(true)
    for (const step of splitSchema.steps) {
      const isValid = validateForm(step)
      setStepValidate(splitSchema, setSplitSchema, step, true)
      if (!isValid) {
        setSubmissionErrorText('Please make sure that all sections have been completed.')
        setSubmitButtonLoading(false)
      }
      if (!modelId) {
        setSubmissionErrorText('Unknown model ID')
        setSubmitButtonLoading(false)
      }
      if (!schemaId) {
        setSubmissionErrorText('Unknown schema ID')
        setSubmitButtonLoading(false)
      }
      if (modelId && schemaId) {
        const data = getStepsData(splitSchema, true)
        const res = await postAccessRequest(modelId, schemaId, data)
        if (res.status && res.status < 400) {
          setSubmissionErrorText('')
          router.push(`/beta/model/${modelId}`)
        } else {
          setSubmitButtonLoading(false)
        }
      }
    }
  }

  if (isSchemaError) {
    return <MessageAlert message={isSchemaError.info.message} severity='error' />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <Wrapper title='Access Request' page='Model'>
      {(isSchemaLoading || isModelLoading || isCurrentUserLoading) && <Loading />}
      {!isSchemaLoading && !isModelLoading && (
        <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
          {(!model || !model.card) && (
            <Typography>Access requests can not be requested if a schema is not set for this model.</Typography>
          )}
          {model && model.card && (
            <Stack spacing={4}>
              <Button
                sx={{ width: 'fit-content' }}
                startIcon={<ArrowBack />}
                onClick={() => router.push(`/beta/model/${modelId}/access/schema`)}
              >
                Choose a different schema
              </Button>
              <ModelCardForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit displayLabelValidation />

              <Stack alignItems='flex-end'>
                <LoadingButton
                  sx={{ width: 'fit-content' }}
                  variant='contained'
                  onClick={onSubmit}
                  loading={submitButtonLoading}
                >
                  Submit
                </LoadingButton>
                <Typography variant='caption' color={theme.palette.error.main}>
                  {submissionErrorText}
                </Typography>
              </Stack>
            </Stack>
          )}
        </Card>
      )}
    </Wrapper>
  )
}
