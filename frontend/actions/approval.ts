import qs from 'querystring'
import useSWR from 'swr'

import { ApprovalRequestInterface } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetApprovalRequestsForUser(isActive = true) {
  const { data, error, mutate } = useSWR<
    {
      approvals: ApprovalRequestInterface[]
    },
    ErrorInfo
  >(
    `/api/v2/approvals?${qs.stringify({
      active: isActive,
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

export function useGetNumApprovals() {
  const { data, error, mutate } = useSWR<
    {
      count: number
    },
    ErrorInfo
  >('/api/v2/approvals/count', fetcher)

  return {
    mutateNumApprovals: mutate,
    numApprovals: data?.count,
    isNumApprovalsLoading: !error && !data,
    isNumApprovalsError: error,
  }
}
