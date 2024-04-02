import { ArrowBack } from '@mui/icons-material'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { useGetRelease, useGetReleasesForModelId } from 'actions/release'
import { postReviewResponse, useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewWithComment, { ResponseTypeKeys } from 'src/common/ReviewWithComment'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ReleaseDisplay from 'src/model/releases/ReleaseDisplay'
import Wrapper from 'src/Wrapper'
import { mutate } from 'swr'
import { getErrorMessage } from 'utils/fetcher'

export default function ReleaseReview() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const [errorMessage, setErrorMessage] = useState('')

  const { model, isModelLoading, isModelError } = useGetModel(modelId)
  const { release, isReleaseLoading, isReleaseError } = useGetRelease(modelId, semver)
  const { mutateReleases } = useGetReleasesForModelId(modelId)
  const { mutateReviews } = useGetReviewRequestsForModel({
    modelId,
    semver: semver as string,
  })

  async function handleSubmit(decision: ResponseTypeKeys, comment: string, role: string) {
    setErrorMessage('')
    if (!modelId || !semver) {
      return setErrorMessage('Could not find model ID')
    }

    const res = await postReviewResponse({
      modelId,
      role,
      comment,
      decision,
      semver,
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
      mutateReleases()
      router.push(`/model/${modelId}?tabs=releases`)
    }
  }

  if (!release || !model || isReleaseLoading || isModelLoading) {
    return <Loading />
  }

  const error = MultipleErrorWrapper(`Unable to load release review page`, {
    isReleaseError,
    isModelError,
  })
  if (error) return error

  return (
    <Wrapper fullWidth title={semver ? semver : 'Loading...'} page='release review'>
      <Container maxWidth='md' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              spacing={2}
              divider={<Divider flexItem orientation='vertical' />}
            >
              <Link href={`/model/${modelId}?tab=releases`}>
                <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                  Back to model
                </Button>
              </Link>
              <Typography variant='h6' component='h1' color='primary'>
                {model ? `Reviewing release ${semver} for model ${model.name}` : 'Loading...'}
              </Typography>
            </Stack>
            <Typography></Typography>
            <ReviewWithComment onSubmit={handleSubmit} release={release} />
            <MessageAlert message={errorMessage} severity='error' />
            <Divider />
            <ReleaseDisplay release={release} model={model} displayReviewBanner={false} />
          </Stack>
        </Paper>
      </Container>
    </Wrapper>
  )
}
