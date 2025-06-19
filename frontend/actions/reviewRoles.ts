import useSWR from 'swr'
import { ReviewRolesFormData } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyRolesList = []

export function useGetAllReviewRoles() {
  const { data, isLoading, error, mutate } = useSWR<
    {
      reviewRoles: ReviewRolesFormData[]
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
