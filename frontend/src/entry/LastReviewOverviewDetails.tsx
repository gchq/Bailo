import { Stack, Typography } from '@mui/material'
import { useGetLatestResponseForReview } from 'actions/response'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import { formatDateStringAsDayMonthAndYear } from 'utils/dateUtils'

interface LastReviewOverviewDetailsProps {
  reviewId: string
}

export default function LastReviewOverviewDetails({ reviewId }: LastReviewOverviewDetailsProps) {
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
        {response ? (
          <Stack direction='row' spacing={1}>
            <div>{formatDateStringAsDayMonthAndYear(response.createdAt.toString())} by</div>
            <UserDisplay dn={response.entity} showIcon />
          </Stack>
        ) : (
          <em>Error fetching review</em>
        )}
      </Typography>
    </>
  )
}
