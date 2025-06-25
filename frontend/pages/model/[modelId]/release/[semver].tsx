import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel, useGetReviewRequestsForUser } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableRelease from 'src/entry/model/releases/EditableRelease'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import ReviewComments from 'src/reviews/ReviewComments'
import { EntryKind } from 'types/types'
import { getCurrentUserRoles, hasRole } from 'utils/roles'

export default function Release() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)

  const { release, isReleaseLoading, isReleaseError } = useGetRelease(modelId, semver)
  const { model, isModelLoading, isModelError } = useGetModel(modelId, EntryKind.MODEL)

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    semver: semver || '',
  })
  const {
    reviews: userReviews,
    isReviewsLoading: isUserReviewsLoading,
    isReviewsError: isUserReviewsError,
  } = useGetReviewRequestsForUser()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const currentUserRoles = useMemo(() => getCurrentUserRoles(model, currentUser), [model, currentUser])

  const userCanReview = useMemo(
    () =>
      hasRole(currentUserRoles, ['msro', 'mtr']) &&
      reviews.filter((review) =>
        userReviews.some(
          (userReview) =>
            userReview.model.id === review.model.id && userReview.accessRequestId === review.accessRequestId,
        ),
      ).length > 0,
    [currentUserRoles, reviews, userReviews],
  )

  const error = MultipleErrorWrapper('Unable to load release', {
    isReleaseError,
    isModelError,
    isReviewsError,
    isUserReviewsError,
    isCurrentUserError,
  })

  if (error) return error

  if (
    !release ||
    !model ||
    isReleaseLoading ||
    isReviewsLoading ||
    isUserReviewsLoading ||
    isModelLoading ||
    isCurrentUserLoading
  ) {
    return <Loading />
  }

  return (
    <>
      <Title text={release ? release.semver : 'Loading...'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper>
          <>
            {userCanReview && <ReviewBanner release={release} />}
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
                <Stack overflow='hidden' direction='row' alignItems='center'>
                  <Typography overflow='hidden' textOverflow='ellipsis' variant='h6' component='h1' color='primary'>
                    {release ? release.semver : 'Loading...'}
                  </Typography>
                  <CopyToClipboardButton
                    textToCopy={release.semver}
                    notificationText='Copied release semver to clipboard'
                    ariaLabel='copy release semver to clipboard'
                  />
                </Stack>
              </Stack>
              {release && (
                <EditableRelease
                  release={release}
                  isEdit={isEdit}
                  onIsEditChange={setIsEdit}
                  readOnly={!!model?.settings.mirror?.sourceModelId}
                />
              )}
              <ReviewComments release={release} isEdit={isEdit} />
            </Stack>
          </>
        </Paper>
      </Container>
    </>
  )
}
