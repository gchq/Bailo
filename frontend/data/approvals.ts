import qs from 'qs'
import useSWR from 'swr'

import { Approval, ApprovalCategory, Deployment, Version } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export type ApprovalFilterType = 'user' | 'archived'

export function useListApprovals(approvalCategory: ApprovalCategory, filter: ApprovalFilterType) {
  const { data, error, mutate } = useSWR<
    {
      approvals: Approval[]
    },
    ErrorInfo
  >(
    `/api/v1/approvals?${qs.stringify({
      approvalCategory,
      filter,
    })}`,
    fetcher
  )

  return {
    mutateApprovals: mutate,
    approvals: data ? data.approvals : [],
    isApprovalsLoading: !error && !data,
    isApprovalsError: error,
  }
}

export function useGetVersionOrDeploymentApprovals(
  approvalCategory: ApprovalCategory,
  versionOrDeploymentId: Version['_id'] | Deployment['_id']
) {
  const { data, error, mutate } = useSWR<
    {
      approvals: Approval[]
    },
    ErrorInfo
  >(`/api/v1/${approvalCategory === 'Upload' ? 'version' : 'deployment'}/${versionOrDeploymentId}/approvals`, fetcher)

  return {
    mutateApprovals: mutate,
    approvals: data?.approvals,
    isApprovalsLoading: !error && !data,
    isApprovalsError: error,
  }
}

export function useGetNumApprovals() {
  const { data, error, mutate } = useSWR<
    {
      count: number
    },
    ErrorInfo
  >(`/api/v1/approvals/count`, fetcher)

  return {
    mutateNumApprovals: mutate,
    numApprovals: data?.count,
    isNumApprovalsLoading: !error && !data,
    isNumApprovalsError: error,
  }
}
