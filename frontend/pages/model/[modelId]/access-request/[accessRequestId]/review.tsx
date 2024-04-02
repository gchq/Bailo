import { ArrowBack } from '@mui/icons-material'
import { Button, Card, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import { useGetAccessRequest, useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useGetModel } from 'actions/model'
import { postReviewResponse, useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewWithComment, { ResponseTypeKeys } from 'src/common/ReviewWithComment'
import UserDisplay from 'src/common/UserDisplay'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import Wrapper from 'src/Wrapper'
import { mutate } from 'swr'
import { formatDateString } from 'utils/dateUtils'
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
      router.push(`/model/${modelId}?tabs=access`)
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
            <ReviewWithComment onSubmit={handleSubmit} accessRequest={accessRequest} />
            <MessageAlert message={errorMessage} severity='error' />
            <Divider />
            <Stack spacing={1} direction='row' justifyContent='space-between' sx={{ mb: 2 }}>
              <Typography variant='caption'>
                Created by {<UserDisplay dn={accessRequest.createdBy} />} on
                <Typography variant='caption' fontWeight='bold'>
                  {` ${formatDateString(accessRequest.createdAt)} `}
                </Typography>
              </Typography>
              {accessRequest.metadata.overview.endDate && (
                <Typography variant='caption'>
                  End Date:
                  <Typography variant='caption' fontWeight='bold' data-test='accessRequestEndDate'>
                    {` ${formatDateString(accessRequest.metadata.overview.endDate)}`}
                  </Typography>
                </Typography>
              )}
            </Stack>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              alignItems='flex-end'
              justifyContent='space-between'
              spacing={4}
            >
              <Card
                sx={{
                  px: 2,
                  pt: 1,
                  pb: 2,
                  width: '100%',
                }}
              >
                <Typography variant='subtitle2' component='h3' mb={1}>
                  Users
                </Typography>
                <Grid container>
                  {accessRequest.metadata.overview.entities.map((entity) => (
                    <Grid item xs={3} key={entity}>
                      <UserDisplay dn={entity} />
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Wrapper>
  )
}
