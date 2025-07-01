import useSWR from 'swr'
import { ReviewRoleInterface, ReviewRolesFormData } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyRolesList = []

export function useGetAllReviewRoles() {
  const { data, isLoading, error, mutate } = useSWR<
    {
      reviewRoles: ReviewRoleInterface[]
    },
    ErrorInfo
  >('/api/v2/review/roles', fetcher)

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
