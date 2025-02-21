import { Divider, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import Loading from 'src/common/Loading'
import ReviewDisplay from 'src/entry/model/reviews/ReviewDisplay'
import MessageAlert from 'src/MessageAlert'
import ReviewRoleDisplay from 'src/reviews/ReviewRoleDisplay'
import { ReviewRequestInterface } from 'types/types'
import { timeDifference } from 'utils/dateUtils'
import { toTitleCase } from 'utils/stringUtils'

type ReviewItemProps = {
  review: ReviewRequestInterface
}

export default function ReviewItem({ review }: ReviewItemProps) {
  const router = useRouter()

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { responses, isResponsesLoading, isResponsesError } = useGetResponses([review._id])

  function handleListItemClick() {
    router.push(
      `/model/${review.model.id}/${
        review.kind === 'release' ? `release/${review.semver}` : `access-request/${review.accessRequestId}`
      }/review?role=${review.role}`,
    )
  }

  function editedAdornment() {
    if (review.updatedAt > review.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(review.updatedAt))}.`
    }
  }

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  if (isCurrentUserLoading || isResponsesLoading) {
    return <Loading />
  }
  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={handleListItemClick} aria-label={`Review model ${review.model} ${review.semver}`}>
          <Stack>
            <Stack
              spacing={1}
              direction='row'
              justifyContent='flex-start'
              alignItems='center'
              divider={<Divider flexItem />}
            >
              <Typography color='primary' variant='h6' component='h2' fontWeight='bold'>
                {review.model.name}
              </Typography>
              {review.accessRequestId && (
                <Typography>
                  {toTitleCase(review.accessRequestId.substring(0, review.accessRequestId.lastIndexOf('-')))}
                </Typography>
              )}
              {review.semver && <Typography>{review.semver}</Typography>}
            </Stack>
            <Stack spacing={1} direction='row' justifyContent='flex-start' alignItems='center'>
              <Typography variant='caption'>{`Created ${timeDifference(
                new Date(),
                new Date(review.createdAt),
              )}.`}</Typography>
              <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
                {editedAdornment()}
              </Typography>
            </Stack>
            <ReviewRoleDisplay review={review} />
            {currentUser && (
              <ReviewDisplay
                modelId={review.model.id}
                reviewResponses={responses}
                showCurrentUserResponses
                currentUserDn={currentUser.dn}
              />
            )}
          </Stack>
        </ListItemButton>
      </ListItem>
    </>
  )
}
