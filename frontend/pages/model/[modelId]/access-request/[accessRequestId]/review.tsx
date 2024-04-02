import { ArrowBack } from '@mui/icons-material'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetAccessRequest, useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useGetModel } from 'actions/model'
import { postReviewResponse, useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewWithComment, { ResponseTypeKeys } from 'src/common/ReviewWithComment'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import AccessRequestDisplay from 'src/model/accessRequests/AccessRequestDisplay'
import Wrapper from 'src/Wrapper'
import { mutate } from 'swr'
import { getErrorMessage } from 'utils/fetcher'

export default function AccessRequestReview() {
  const router = useRouter()
  const { modelId, accessRequestId }: { modelId?: string; accessRequestId?: string } = router.query

  const [errorMessage, setErrorMessage] = useState('')

  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { accessRequest, isAccessRequestLoading, isAccessRequestError } = useGetAccessRequest(modelId, accessRequestId)
  const { mutateAccessRequests } = useGetAccessRequestsForModelId(modelId)
  const { mutateReviews } = useGetReviewRequestsForModel({
    modelId,
    accessRequestId: accessRequestId as string,
  })

  async function handleSubmit(decision: ResponseTypeKeys, comment: string, role: string) {
    setErrorMessage('')
    if (!modelId || !accessRequestId) {
      return setErrorMessage('Could not find model ID')
    }

    const res = await postReviewResponse({
      modelId,
      role,
      comment,
      decision,
      accessRequestId,
    })

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      mutate(
        (key) => {
          return typeof key === 'string' && key.startsWith('/api/v2/reviews')
        },
        undefined,
        { revalidate: true },
      )
      mutateReviews()
      mutateAccessRequests()
      router.push(`/model/${modelId}?tabs=releases`)
    }
  }

  if (!accessRequest || !model || isAccessRequestLoading || isModelLoading) {
    return <Loading />
  }

  const error = MultipleErrorWrapper(`Unable to load release review page`, {
    isAccessRequestError,
    isModelError,
  })
  if (error) return error

  return (
    <Wrapper fullWidth title={accessRequestId ? accessRequestId : 'Loading...'} page='access request review'>
      <Container maxWidth='md' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={2}
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Link href={`/model/${modelId}?tab=access`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to model
                </Button>
              </Link>
              <Typography variant='h6' component='h1' color='primary'>
                {model ? `Reviewing access request ${accessRequestId} for model ${model.name}` : 'Loading...'}
              </Typography>
            </Stack>
            <Typography></Typography>
            <ReviewWithComment onSubmit={handleSubmit} accessRequest={accessRequest} />
            <MessageAlert message={errorMessage} severity='error' />
            <Divider />
            <AccessRequestDisplay accessRequest={accessRequest} displayReviewBanner={false} />
          </Stack>
        </Paper>
      </Container>
    </Wrapper>
  )
}
