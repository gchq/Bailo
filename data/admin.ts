import useSWR from 'swr'
import qs from 'qs'
import { fetcher } from 'utils/fetcher'
import { LogEntry } from '../types/interfaces'

interface GetAppLogsArgs {
  after?: Date
  before?: Date
  level?: number
  filter?: Array<string>
  search?: string
  isRegex?: boolean
  buildId?: string
  requestId?: string
  disabled?: boolean
}

export function useGetAppLogs({
  level,
  after,
  before,
  filter,
  search,
  isRegex,
  buildId,
  requestId,
  disabled,
}: GetAppLogsArgs) {
  const query: Record<string, unknown> = {
    filter,
  }

  if (after) query.after = after
  if (before) query.before = before
  if (search) query.search = search
  if (isRegex) query.isRegex = isRegex
  if (level) query.level = level

  let group = ''
  if (buildId) group = `/build/${buildId}`
  if (requestId) group = `/request/${requestId}`

  const { data, error, mutate } = useSWR<{ logs: Array<LogEntry> }>(
    disabled ? null : `/api/v1/admin/logs${group}?${qs.stringify(query)}`,
    fetcher
  )

  return {
    mutateLogs: mutate,
    logs: data,
    isLogsLoading: !error && !data,
    isLogsError: error,
  }
}
