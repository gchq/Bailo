import useSWR from 'swr'
import qs from 'qs'
import { fetcher } from 'utils/fetcher'
import { LogEntry } from '../types/interfaces'

interface GetAppLogsArgs {
  after?: Date
  before?: Date
  filter: Array<string>
  search?: string
  regex?: boolean
  buildId?: string
  reqId?: string
  disabled?: boolean
}
export function useGetAppLogs({ after, before, filter, search, regex, buildId, reqId, disabled }: GetAppLogsArgs) {
  const query: Record<string, unknown> = {
    filter,
  }

  if (after) query.after = after
  if (before) query.before = before
  if (search) query.search = search
  if (regex) query.regex = regex

  let group = ''
  if (buildId) group = `/build/${buildId}`
  if (reqId) group = `/request/${reqId}`

  const { data, error, mutate } = useSWR<{ logs: Array<LogEntry> }>(
    disabled
      ? null
      : `/api/v1/admin/logs${group}?${qs.stringify({
          after,
          before,
          filter,
          search,
          regex,
        })}`,
    fetcher
  )

  return {
    mutateLogs: mutate,
    logs: data,
    isLogsLoading: !error && !data,
    isLogsError: error,
  }
}
