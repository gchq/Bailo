import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { ReviewRequestInterface } from 'types/types'
import { timeDifference } from 'utils/dateUtils'

type ReviewItemProps = {
  review: ReviewRequestInterface
}

export default function DeploymentAssessmentReviewItem({ review }: ReviewItemProps) {
  const router = useRouter()

  function handleListItemClick() {
    router.push(`/deployment-assessments/${review.deploymentAssessmentId}/review`)
  }

  const editedAdornment = useCallback(() => {
    if (review.updatedAt > review.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(review.updatedAt))}.`
    }
  }, [review.createdAt, review.updatedAt])

  const listItemContent = useMemo(() => {
    if (review) {
      return (
        <Stack>
          <Stack spacing={1} direction='column' sx={{ justifyContent: 'flex-start' }}>
            <Typography sx={{ wordBreak: 'break-all', fontWeight: 'bold' }} color='primary' variant='h6' component='h2'>
              {review.deploymentAssessment?.name}
            </Typography>
          </Stack>
          <Stack spacing={1} direction='row' sx={{ justifyContent: 'flex-start', alignItems: 'center' }}>
            <Typography variant='caption'>{`Created ${timeDifference(
              new Date(),
              new Date(review.createdAt),
            )}.`}</Typography>
            <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
              {editedAdornment()}
            </Typography>
          </Stack>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 'medium' }} color='warning' />
            <Typography variant='subtitle2' sx={{ fontStyle: 'italic' }} component='p'>
              This deployment assessment needs to be reviewed by the deployment risk owner.
            </Typography>
          </Stack>
        </Stack>
      )
    }
  }, [editedAdornment, review])

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={handleListItemClick} aria-label={`Review deployment assessment`}>
          {listItemContent}
        </ListItemButton>
      </ListItem>
    </>
  )
}
