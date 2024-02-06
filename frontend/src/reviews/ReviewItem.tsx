import { ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import ReviewDisplay from 'src/model/beta/reviews/ReviewDisplay'
import ReviewRoleDisplay from 'src/reviews/ReviewRoleDisplay'
import { ReviewRequestInterface } from 'types/interfaces'
import { timeDifference } from 'utils/dateUtils'

type ReviewItemProps = {
  review: ReviewRequestInterface
}

export default function ReviewItem({ review }: ReviewItemProps) {
  const router = useRouter()

  function handleListItemClick() {
    const tab = review.kind === 'release' ? 'releases' : 'access'
    router.push(`/beta/model/${review.model.id}?tab=${tab}`)
  }

  function editedAdornment() {
    if (review.updatedAt > review.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(review.updatedAt))}.`
    }
  }
  return (
    <ListItem disablePadding>
      <ListItemButton onClick={handleListItemClick} aria-label={`Review model ${review.model} ${review.semver}`}>
        <Stack>
          <Stack spacing={1} direction='row' justifyContent='flex-start' alignItems='center'>
            <Typography color='primary' variant='h6' component='h2' fontWeight='bold'>
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
          <ReviewRoleDisplay review={review} />
          <ReviewDisplay reviews={[review]} />
        </Stack>
      </ListItemButton>
    </ListItem>
  )
}
