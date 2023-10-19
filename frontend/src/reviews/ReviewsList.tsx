import { List, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import MessageAlert from 'src/MessageAlert'

import { useGetReviewRequestsForUser } from '../../actions/review'
import { ReviewRequestInterface } from '../../types/interfaces'
import { timeDifference } from '../../utils/dateUtils'
import EmptyBlob from '../common/EmptyBlob'
import Loading from '../common/Loading'

type ReviewsListProps = {
  isActive?: boolean
  kind?: 'release' | 'access' | 'all'
}

export default function ReviewsList({ isActive = true, kind = 'all' }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser(isActive)
  const [filteredReviews, setFilteredReviews] = useState<ReviewRequestInterface[]>([])

  useEffect(() => {
    if (kind === 'all') {
      setFilteredReviews(reviews)
    } else {
      setFilteredReviews(reviews.filter((filteredReview) => filteredReview.kind === kind))
    }
  }, [reviews, setFilteredReviews, kind])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {isReviewsLoading && <Loading />}
      {filteredReviews.length === 0 && <EmptyBlob text='No reviews found' />}
      <List>
        {filteredReviews.map((review) => (
          <ReviewItem key={review.semver} review={review} />
        ))}
      </List>
    </>
  )
}

type ReviewItemProps = {
  review: ReviewRequestInterface
}

function ReviewItem({ review }: ReviewItemProps) {
  const router = useRouter()

  function listItemOnClick() {
    router.push(`/beta/model/${review.model.id}?tab=releases`)
  }
  function editedAdornment() {
    if (review.updatedAt > review.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(review.updatedAt))}.`
    }
  }
  return (
    <ListItem disablePadding>
      <ListItemButton onClick={listItemOnClick} aria-label={`Review model ${review.model} ${review.semver}`}>
        <Stack>
          <Stack spacing={1} direction='row' justifyContent='flex-start' alignItems='center'>
            <Typography color='primary' variant='h6' component='h2' sx={{ fontWeight: 'bold' }}>
              {review.model.name}
            </Typography>
            <Typography>{review.semver}</Typography>
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
        </Stack>
      </ListItemButton>
    </ListItem>
  )
}
