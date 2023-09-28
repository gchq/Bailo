import qs from 'querystring'
import useSWR from 'swr'

import { ReviewRequestInterface } from '../types/interfaces'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetReviewRequestsForUser(isActive = true) {
  const { data, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(
    `/api/v2/reviews/?${qs.stringify({
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

export function useGetReviewRequestsForModel(modelId, semver?, isActive = true) {
  const { data, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(
    semver
      ? `/api/v2/reviews?${qs.stringify({
          active: isActive,
          modelId,
          semver,
        })}`
      : `/api/v2/reviews?${qs.stringify({
          active: isActive,
          modelId,
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

// TODO - this API has been removed
export function useGetNumReviews() {
  const { data, error, mutate } = useSWR('/api/v2/reviews?active=true', fetcher)

  return {
    mutateNumReviews: mutate,
    numReviews: data?.reviews?.length,
    isNumReviewsLoading: !error && !data,
    isNumReviewsError: error,
  }
}

export async function postReviewResponse(
  modelId: string,
  semver: string,
  role: string,
  comment: string,
  decision: string,
) {
  return fetch(`/api/v2/model/${modelId}/releases/${semver}/review`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment, decision, role }),
  })
}
