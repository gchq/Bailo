import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import EditableRelease from 'src/model/beta/releases/EditableRelease'
import ReviewBanner from 'src/model/beta/reviews/ReviewBanner'
import ReviewComments from 'src/reviews/ReviewComments'
import Wrapper from 'src/Wrapper'

export default function Release() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)

  const { release, isReleaseLoading, isReleaseError } = useGetRelease(modelId, semver)
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    semver: semver || '',
  })

  const error = MultipleErrorWrapper('Unable to load release', {
    isReleaseError,
    isReviewsError,
  })

  if (error) return error

  if (!release || (isReleaseLoading && isReviewsLoading)) {
    return <Loading />
  }

  return (
    <Wrapper fullWidth title={release ? release.semver : 'Loading...'} page='release'>
      <Container maxWidth='md' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper>
          <>
            {reviews.length > 0 && <ReviewBanner release={release} />}
            <Stack spacing={2} sx={{ p: 4 }}>
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
                  {release ? release.semver : 'Loading...'}
                </Typography>
              </Stack>
              {release && <EditableRelease release={release} isEdit={isEdit} onIsEditChange={setIsEdit} />}
              <ReviewComments release={release} isEdit={isEdit} />
            </Stack>
          </>
        </Paper>
      </Container>
    </Wrapper>
  )
}
