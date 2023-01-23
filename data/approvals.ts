import qs from 'qs'
import useSWR from 'swr'
import { Approval } from '../types/interfaces'
import { fetcher } from '../utils/fetcher'

export type ApprovalCategory = 'Upload' | 'Deployment'
export type ReviewFilterType = 'user' | 'archived'
export function useListApprovals(category: ApprovalCategory, filter: ReviewFilterType) {
  const { data, error, mutate } = useSWR<{
    approvals: Array<Approval>
  }>(
    `/api/v1/approvals?${qs.stringify({
      category,
      filter,
    })}`,
    fetcher
  )

  return {
    mutateApprovals: mutate,
    approvals: data?.approvals,
    isApprovalsLoading: !error && !data,
    isApprovalsError: error,
  }
}

export function useGetNumApprovals() {
  const { data, error, mutate } = useSWR<{
    count: number
  }>(`/api/v1/approvals/count`, fetcher)

  return {
    mutateNumApprovals: mutate,
    numApprovals: data?.count,
    isNumApprovalsLoading: !error && !data,
    isNumApprovalsError: error,
  }
}
