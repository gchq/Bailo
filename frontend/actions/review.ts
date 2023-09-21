import qs from 'querystring'
import useSWR from 'swr'

import { ReviewRequestInterface } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetReviewRequestsForUser(isActive = true) {
  const { data, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(
    `/api/v2/reviews?${qs.stringify({
      active: isActive,
    })}`,
    fetcher,
  )

  return {
    mutateReviews: mutate,
    reviews: data ? data.reviews : [],
    isReviewsLoading: !error && !data,
    isReviewsError: error,
  }
}

export function useGetNumReviews() {
  const { data, error, mutate } = useSWR<
    {
      count: number
    },
    ErrorInfo
  >('/api/v2/reviews/count', fetcher)

  return {
    mutateNumReviews: mutate,
    numReviews: data?.count,
    isNumReviewsLoading: !error && !data,
    isNumReviewsError: error,
  }
}
