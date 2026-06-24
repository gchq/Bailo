import { Dayjs } from '@dayjs'
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

const REVIEW_ID_PATTERN = /^[A-Za-z0-9_-]+$/
function isValidReviewId(reviewId: string) {
  return REVIEW_ID_PATTERN.test(reviewId)
}

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
  modelId: EntryInterface['id']
  kind?: ReviewKindKeys
  open?: boolean
} & additionalParameters

export function useGetReviewRequestsForModel({
  modelId,
  semver,
  accessRequestId,
  reviewId,
  kind,
  open,
}: GetReviewRequestsForModelQuery) {
  const { data, isLoading, error, mutate } = useSWR<
    {
      reviews: ReviewRequestInterface[]
    },
    ErrorInfo
  >(
    `/api/v2/reviews?${qs.stringify({
      mine: false,
      modelId,
      ...(semver && { semver }),
      ...(accessRequestId && { accessRequestId }),
      ...(reviewId && { reviewId }),
      ...(kind && { kind }),
      ...(open !== undefined && { open }),
    })}`,
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
  if (!isValidReviewId(reviewId)) {
    throw new Error('Invalid review ID')
  }

  return fetch(`/api/v3/review/${reviewId}/response`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment, decision, dueDate, kind }),
  })
}

type PostReviewParams = {
  modelId: string
  kind: ReviewKindKeys
  dueDate?: Dayjs | null
  semver?: string
  accessRequestId?: string
}
export async function postReview({ modelId, kind, dueDate, semver, accessRequestId }: PostReviewParams) {
  return fetch(`/api/v3/review/${modelId}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, dueDate, semver, accessRequestId }),
  })
}

export async function postNotifyReviewer(reviewId: string) {
  return fetch(`/api/v3/review/${reviewId}/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}
