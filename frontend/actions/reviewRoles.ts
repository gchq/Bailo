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

export type UpdateReviewRolesParams = Pick<
  ReviewRoleInterface,
  'shortName' | 'name' | 'description' | 'defaultEntities' | 'collaboratorRole'
>

export function putReviewRole(reviewRole: UpdateReviewRolesParams) {
  const { shortName, ...reviewRoleNoShort } = { ...reviewRole }
  return fetch(`/api/v2/review/role/${shortName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewRoleNoShort),
  })
}

export async function deleteReviewRole(reviewRoleShortName: string) {
  return fetch(`/api/v2/review/role/${reviewRoleShortName}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  })
}
