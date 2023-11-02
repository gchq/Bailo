import qs from 'querystring'
import { ResponseTypeKeys } from 'src/common/ReviewWithComment'
import useSWR from 'swr'
import { ModelInterface, ReleaseInterface } from 'types/types'

import { AccessRequestInterface, ReviewRequestInterface } from '../types/interfaces'
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

type SemverOrAccessRequestId =
  | {
      semver: ReleaseInterface['semver']
      accessRequestId?: never
    }
  | {
      semver?: never
      accessRequestId: AccessRequestInterface['id'] | undefined
    }

type GetReviewRequestsForModelQuery = {
  modelId: ModelInterface['id'] | undefined
  isActive: boolean
} & SemverOrAccessRequestId

export function useGetReviewRequestsForModel({
  modelId,
  isActive,
  semver,
  accessRequestId,
}: GetReviewRequestsForModelQuery) {
  const { data, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(
    `/api/v2/reviews?${qs.stringify({
      modelId,
      active: isActive,
      ...(semver && { semver }),
      ...(accessRequestId && { accessRequestId }),
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

export async function getReviewCount() {
  return fetch('/api/v2/reviews?active=true', {
    method: 'head',
    headers: { 'Content-Type': 'application/json' },
  })
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
