import { Dayjs } from 'dayjs'
import qs from 'querystring'
import useSWR from 'swr'
import {
  AccessRequestInterface,
  DecisionKeys,
  EntryInterface,
  ReleaseInterface,
  ReviewKindKeys,
  ReviewRequestInterface,
} from 'types/types'

import { ErrorInfo, fetcher } from '../utils/fetcher'

const emptyReviewList = []

export function useHeadReviewRequestsForUser(open?: boolean, kind?: ReviewKindKeys) {
  const queryParams = { ...(open !== undefined && { open }), ...(kind !== undefined && { kind }) }

  const { data, isLoading, error, mutate } = useSWR<
    {
      headers: any
    },
    ErrorInfo
  >(['head', `/api/v2/reviews?${qs.stringify(queryParams)}`], ([, url]: string) => fetcher(url, true))

  return {
    mutateReviews: mutate,
    reviewCountHeader: data?.headers['x-count'] ? parseInt(data.headers['x-count']) : 0,
    isReviewsLoading: isLoading,
    isReviewsError: error,
  }
}

export function useGetReviewRequestsForUser(open?: boolean) {
  const queryParams = { ...(open !== undefined && { open }) }
  const { data, isLoading, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(`/api/v2/reviews?${qs.stringify(queryParams)}`, fetcher)

  return {
    mutateReviews: mutate,
    reviews: data ? data.reviews : emptyReviewList,
    isReviewsLoading: isLoading,
    isReviewsError: error,
  }
}

type additionalParameters =
  | {
      semver: ReleaseInterface['semver']
      accessRequestId?: never
      reviewId?: never
    }
  | {
      semver?: never
      accessRequestId: AccessRequestInterface['id']
      reviewId?: never
    }
  | {
      semver?: never
      accessRequestId?: never
      reviewId?: string
    }

type GetReviewRequestsForModelQuery = {
  modelId?: EntryInterface['id']
} & additionalParameters

export function useGetReviewRequestsForModel({
  modelId,
  semver,
  accessRequestId,
  reviewId,
}: GetReviewRequestsForModelQuery) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(
    (modelId && semver) || (modelId && accessRequestId) || (modelId && reviewId)
      ? `/api/v2/reviews?${qs.stringify({
          mine: false,
          modelId,
          ...(semver && { semver }),
          ...(accessRequestId && { accessRequestId }),
          ...(reviewId && { reviewId }),
        })}`
      : null,
    fetcher,
  )

  return {
    reviews: data ? data.reviews : [],
    isReviewsLoading: isLoading,
    isReviewsError: error,
    mutateReviews: mutate,
  }
}

type PostReviewResponseParams = {
  modelId: string
  decision: DecisionKeys
  comment: string
  role: string
} & additionalParameters

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

type PostGenericReviewResponseParams = {
  kind: ReviewKindKeys
  reviewId: string
  decision: DecisionKeys
  comment: string
  dueDate?: Dayjs | null
}
export async function postGenericReviewResponse({
  kind,
  reviewId,
  comment,
  decision,
  dueDate,
}: PostGenericReviewResponseParams) {
  return fetch(`/api/v3/review/${reviewId}/response`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment, decision, dueDate, kind }),
  })
}
