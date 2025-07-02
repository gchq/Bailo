import qs from 'querystring'
import useSWR from 'swr'
import { ReviewRoleInterface, ReviewRolesFormData } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyRolesList = []

export function useGetReviewRoles(schemaId?: string) {
  const queryParams = {
    ...(schemaId && { schemaId }),
  }
  const { data, isLoading, error, mutate } = useSWR<
    {
      reviewRoles: ReviewRoleInterface[]
    },
    ErrorInfo
  >(
    Object.entries(queryParams).length > 0
      ? `/api/v2/review/roles?${qs.stringify(queryParams)}`
      : '/api/v2/review/roles',
    fetcher,
  )

  return {
    mutateReviewRoles: mutate,
    reviewRoles: data ? data.reviewRoles : emptyRolesList,
    isReviewRolesLoading: isLoading,
    isReviewRolesError: error,
  }
}

export async function postReviewRole(reviewRole: ReviewRolesFormData) {
  return fetch('/api/v2/review/role', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewRole),
  })
}

export async function deleteReviewRole(reviewRoleId: string) {
  return fetch(`/api/v2/review/role/${reviewRoleId}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  })
}
