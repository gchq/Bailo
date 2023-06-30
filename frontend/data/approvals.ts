import qs from 'qs'
import useSWR from 'swr'

import { Approval, Deployment, Version } from '../types/types'
import { fetcher } from '../utils/fetcher'

export type ApprovalCategory = 'Upload' | 'Deployment'
export type ApprovalFilterType = 'user' | 'archived'
export function useListApprovals(
  approvalCategory: ApprovalCategory,
  filter: ApprovalFilterType,
  versionOrDeploymentId?: Version['_id'] | Deployment['_id']
) {
  const { data, error, mutate } = useSWR<{
    approvals: Approval[]
  }>(
    `/api/v1/approvals?${qs.stringify({
      approvalCategory,
      filter,
      versionOrDeploymentId,
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
