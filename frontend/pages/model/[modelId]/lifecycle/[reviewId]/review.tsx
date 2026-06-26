import { Dayjs } from '@dayjs'
import { ArrowBack } from '@mui/icons-material'
import { Button, Container, Dialog, DialogContent, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { useGetResponses } from 'actions/response'
import { postGenericReviewResponse, useGetReviewRequestsForModel } from 'actions/review'
import { useGetSchema } from 'actions/schema'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewWithComment from 'src/common/ReviewWithComment'
import Title from 'src/common/Title'
import UserDisplay from 'src/common/UserDisplay'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import JsonSchemaForm from 'src/Form/JsonSchemaForm'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { Decision, DecisionKeys, ReviewKind, SplitSchemaNoRender } from 'types/types'
import { formatDateStringAsDayMonthAndYear } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { getStepsFromSchema } from 'utils/formUtils'

export default function LifecycleReview() {
  const router = useRouter()
  const { modelId, reviewId }: { modelId?: string; reviewId?: string } = router.query

  const [errorMessage, setErrorMessage] = useState('')
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)
  const [isModelCardDialogOpen, setIsModelCardDialogOpen] = useState(false)
  const [splitSchema, setSplitSchema] = useState<SplitSchemaNoRender>({ reference: '', steps: [] })

  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(modelId)
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { reviews, isReviewsLoading, isReviewsError, mutateReviews } = useGetReviewRequestsForModel({
    modelId: modelId as string,
    reviewId: `${reviewId}`,
  })
  const { schema, isSchemaLoading, isSchemaError } = useGetSchema(model?.card.schemaId || '')
  const { responses, isResponsesLoading, isResponsesError } = useGetResponses([reviewId as string])

  const onSplitSchemaChange = useEffectEvent((newSplitSchema: SplitSchemaNoRender) => {
    setSplitSchema(newSplitSchema)
  })

  useEffect(() => {
    if (!model || !schema) {
      return
    }
    const steps = getStepsFromSchema(
      schema,
      {},
      ['properties.contacts'],
      model.card.metadata,
      model.mirroredCard?.metadata || {},
    )
    for (const step of steps) {
      step.steps = steps
    }
    onSplitSchemaChange({ reference: schema.id, steps })
  }, [schema, model])

  async function handleSubmit(decision: DecisionKeys, comment: string, _role: string, dueDate: Dayjs | null) {
    setErrorMessage('')
    if (!modelId) {
      return setErrorMessage('Could not find model ID')
    }
    if (!reviewId) {
      return setErrorMessage('Could not find review ID')
    }
    if (decision === Decision.Approve && !dueDate) {
      return setErrorMessage('Please provide a valid due date.')
    }

    setIsReviewButtonLoading(true)
    const res = await postGenericReviewResponse({
      kind: ReviewKind.LIFECYCLE,
      comment,
      decision,
      reviewId,
      dueDate,
    })

    if (!res.ok) {
      setIsReviewButtonLoading(false)
      setErrorMessage(await getErrorMessage(res))
    } else {
      mutateReviews()
      router.push(`/model/${modelId}`)
    }
  }

  const responseList = useMemo(() => {
    return responses.map((response) => (
      <Stack key={response._id} spacing={1}>
        <Stack direction='row' spacing={1}>
          <UserDisplay dn={response.entity} showIcon />
          <Typography variant='caption'>
            Reviewed at: {formatDateStringAsDayMonthAndYear(response.createdAt)}
          </Typography>
        </Stack>
        <Typography>{response.comment}</Typography>
      </Stack>
    ))
  }, [responses])

  const error = MultipleErrorWrapper('Unable to load release review page', {
    isModelError,
    isUiConfigError,
    isReviewsError,
    isSchemaError,
    isResponsesError,
  })
  if (error) {
    return error
  }

  if (
    !reviews ||
    !model ||
    !uiConfig ||
    !schema ||
    !responses ||
    isReviewsLoading ||
    isModelLoading ||
    isUiConfigLoading ||
    isSchemaLoading ||
    isResponsesLoading
  ) {
    return <Loading />
  }

  return (
    <>
      <Title text={reviewId ? `Lifecycle review for ${model.name}` : 'Loading...'} />
      <Container maxWidth='md' sx={{ my: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={2}
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Link href={`/model/${modelId}`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to model
                </Button>
              </Link>
              <Typography variant='h6' component='h1' color='primary'>
                {model ? `Reviewing ${model.name}` : 'Loading...'}
              </Typography>
              <Button onClick={() => setIsModelCardDialogOpen(true)}>View full model card</Button>
            </Stack>
            {responses.length === 0 ? (
              <>
                <ReviewWithComment
                  onSubmit={handleSubmit}
                  reviews={reviews}
                  loading={isReviewButtonLoading}
                  modelId={modelId as string}
                  includeDueDate
                  hideRequestChangesButton
                />
                <MessageAlert message={errorMessage} severity='error' />
              </>
            ) : (
              <>
                <Typography>This lifecycle review has already been approved.</Typography>
                {responseList}
              </>
            )}
          </Stack>
          <Dialog open={isModelCardDialogOpen} onClose={() => setIsModelCardDialogOpen(false)} maxWidth='md' fullWidth>
            <DialogContent sx={{ p: 4 }}>
              <JsonSchemaForm splitSchema={splitSchema} setSplitSchema={setSplitSchema} canEdit={false} />
            </DialogContent>
          </Dialog>
        </Paper>
      </Container>
    </>
  )
}
