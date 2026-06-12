import { Button, Typography } from '@mui/material'
import { useGetLatestResponseForReview } from 'actions/response'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import ReviewHistoryDialog from 'src/entry/overview/ReviewHistoryDialog'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import { EntryInterface } from 'types/types'
import { formatDateStringAsDayMonthAndYear } from 'utils/dateUtils'

interface LastReviewOverviewDetailsProps {
  reviewId: string
  entry: EntryInterface
  mutateEntry: () => void
}

export default function LastReviewOverviewDetails({ reviewId, entry, mutateEntry }: LastReviewOverviewDetailsProps) {
  const [reviewHistoryOpen, setReviewHistoryOpen] = useState(false)

  const { response, isResponseLoading, isResponseError } = useGetLatestResponseForReview(reviewId)

  if (isResponseLoading) {
    return <Loading />
  }

  if (isResponseError) {
    return <ErrorWrapper message={isResponseError.info.message} />
  }

  return (
    <>
      <Typography fontWeight='bold' color='primary'>
        Last reviewed:
      </Typography>
      <Typography>
        {response ? formatDateStringAsDayMonthAndYear(response.createdAt.toString()) : 'Invalid date'}
      </Typography>
      <Typography fontWeight='bold' color='primary'>
        Last reviewed by:
      </Typography>
      {response ? <UserDisplay dn={response.entity} showIcon /> : <Typography>Invalid user</Typography>}
      <Button onClick={() => setReviewHistoryOpen(true)}>Review history</Button>
      <ReviewHistoryDialog
        open={reviewHistoryOpen}
        onClose={() => setReviewHistoryOpen(false)}
        entry={entry}
        mutateEntry={mutateEntry}
      />
    </>
  )
}
