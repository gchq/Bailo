import qs from 'querystring'
import { ResponseTypeKeys } from 'src/common/ReviewWithComment'
import useSWR from 'swr'
import { AccessRequestInterface, ModelInterface, ReleaseInterface, ReviewRequestInterface } from 'types/types'

import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetReviewRequestsForUser() {
  const { data, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >('/api/v2/reviews', fetcher)

  return {
    mutateReviews: mutate,
    reviews: data ? data.reviews : [],
    isReviewsLoading: !error && !data,
    isReviewsError: error,
  }
}

type SemverOrAccessRequestId =
  | {
      semver: ReleaseInterface['semver']
      accessRequestId?: never
    }
  | {
      semver?: never
      accessRequestId: AccessRequestInterface['id']
    }

type GetReviewRequestsForModelQuery = {
  modelId?: ModelInterface['id']
} & SemverOrAccessRequestId

export function useGetReviewRequestsForModel({ modelId, semver, accessRequestId }: GetReviewRequestsForModelQuery) {
  const { data, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(
    (modelId && semver) || (modelId && accessRequestId)
      ? `/api/v2/reviews?${qs.stringify({
          mine: false,
          modelId,
          ...(semver && { semver }),
          ...(accessRequestId && { accessRequestId }),
        })}`
      : null,
    fetcher,
  )

  return {
    reviews: data ? data.reviews : [],
    isReviewsLoading: !error && !data,
    isReviewsError: error,
    mutateReviews: mutate,
  }
}

type PostReviewResponseParams = {
  modelId: string
  decision: ResponseTypeKeys
  comment: string
  role: string
} & SemverOrAccessRequestId

export async function postReviewResponse({
  modelId,
  role,
  comment,
  decision,
  semver,
  accessRequestId,
}: PostReviewResponseParams) {
  return fetch(
    `/api/v2/model/${modelId}/${semver ? 'release' : 'access-request'}/${semver || accessRequestId}/review`,
    {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment, decision, role }),
    },
  )
}
