import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { putRelease, UpdateReleaseParams, useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel, useGetReviewRequestsForUser } from 'actions/review'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import { DraftBanner } from 'src/entry/model/releases/DraftBanner'
import EditableRelease from 'src/entry/model/releases/EditableRelease'
import ReleaseAssetsResponses from 'src/entry/model/releases/ReleaseAssetsResponses'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import ReviewComments from 'src/reviews/ReviewComments'
import { ReviewKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { getCurrentUserRoles, hasRole } from 'utils/roles'

export default function Release() {
  const router = useRouter()
  const { modelId, semver }: { modelId?: string; semver?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)
  const [putErrorMessage, setPutErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { release, isReleaseLoading, isReleaseError, mutateRelease } = useGetRelease(modelId, semver)
  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(modelId)

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: modelId as string,
    semver: semver || '',
  })
  const {
    reviews: userReviews,
    isReviewsLoading: isUserReviewsLoading,
    isReviewsError: isUserReviewsError,
  } = useGetReviewRequestsForUser()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles(
    model ? model.card.schemaId : undefined,
  )
  const currentUserRoles = useMemo(() => getCurrentUserRoles(model, currentUser), [model, currentUser])

  const userCanReview = useMemo(
    () =>
      hasRole(
        currentUserRoles,
        reviewRoles.map((role) => role.shortName),
      ) &&
      reviews.filter((review) =>
        userReviews.some(
          (userReview) =>
            userReview.model.id === review.model.id && userReview.accessRequestId === review.accessRequestId,
        ),
      ).length > 0 &&
      !release?.draft,
    [currentUserRoles, reviewRoles, reviews, release?.draft, userReviews],
  )

  const error = MultipleErrorWrapper('Unable to load release', {
    isReleaseError,
    isModelError,
    isReviewsError,
    isUserReviewsError,
    isCurrentUserError,
    isReviewRolesError,
  })

  if (error) {
    return error
  }

  if (
    !release ||
    !model ||
    isReleaseLoading ||
    isReviewsLoading ||
    isUserReviewsLoading ||
    isModelLoading ||
    isCurrentUserLoading ||
    isReviewRolesLoading
  ) {
    return <Loading />
  }

  //hmmm... recreate this or change
  async function handleDraftRelease() {
    if (!model || !release || !semver) {
      return
    }
    const updatedRelease: UpdateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: release.modelCardVersion,
      notes: release.notes,
      fileIds: [],
      images: [],
    }

    setIsLoading(true)

    const response = await putRelease(updatedRelease)

    if (!response.ok) {
      setPutErrorMessage(await getErrorMessage(response))
    } else {
      mutateRelease()
    }

    setIsLoading(false)
  }

  return (
    <>
      <Title text={release ? release.semver : 'Loading...'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='releaseContainer'>
        <Paper>
          <>
            {userCanReview && <ReviewBanner release={release} />}
            {release.draft && (
              <DraftBanner
                text='This is a draft release'
                handlePublish={handleDraftRelease}
                showButton={true}
                disableButton={isEdit}
                isLoading={isLoading}
                errorMessage={putErrorMessage}
              />
            )}
            <Stack spacing={2} sx={{ px: 4, py: 2 }}>
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
                <Stack
                  direction='row'
                  sx={{
                    overflow: 'hidden',
                    alignItems: 'center',
                  }}
                >
                  <Typography
                    variant='h6'
                    component='h1'
                    color='primary'
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {release ? release.semver : 'Loading...'}
                  </Typography>
                  <CopyToClipboardButton
                    textToCopy={release.semver}
                    notificationText='Copied release semver to clipboard'
                    ariaLabel='copy release semver to clipboard'
                  />
                </Stack>
              </Stack>
              <ReleaseAssetsResponses model={model} release={release} />
              {release && (
                <EditableRelease
                  release={release}
                  isEdit={isEdit}
                  onIsEditChange={setIsEdit}
                  readOnly={!!model?.settings.mirror?.sourceModelId}
                />
              )}
              <ReviewComments
                identifier={release.semver}
                parentId={release._id}
                entryId={release.modelId}
                kind={ReviewKind.RELEASE}
                isEdit={isEdit}
                mutator={mutateRelease}
              />
            </Stack>
          </>
        </Paper>
      </Container>
    </>
  )
}
