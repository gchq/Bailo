import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import ChildLogDetails from '@/src/LogTree/ChildLogDetails'
import { LogEntry, LogLevel, LogType } from '../../types/interfaces'
import { useGetAppLogs } from '../../data/admin'
import { useGetUiConfig } from '../../data/uiConfig'

function getLogType(log: LogEntry): LogType {
  switch (log.code) {
    case 'starting_model_build':
      return LogType.Build
    case 'request':
      return LogType.Request
    default:
      return LogType.Misc
  }
}

export interface LogQuery {
  level: LogLevel
  buildId: string
  requestId: string
  search: string
  isRegex: boolean
}

interface LogTreeProps {
  level: LogLevel
  buildId: string
  requestId: string
  search: string
  isRegex: boolean
  doSearch: boolean
  resetDoSearch: () => void
}

export default function LogTree({
  level,
  buildId,
  requestId,
  search,
  isRegex,
  doSearch,
  resetDoSearch,
}: LogTreeProps): ReactElement {
  const { uiConfig } = useGetUiConfig()
  const [query, setQuery] = useState({
    level,
    buildId,
    requestId,
    search,
    isRegex,
  })

  const { logs } = useGetAppLogs({
    ...query,
    filter: ['request', 'build', 'misc'],
  })

  useEffect(() => {
    if (doSearch) {
      setQuery({
        level,
        buildId,
        requestId,
        search,
        isRegex,
      })
      resetDoSearch()
    }
  }, [buildId, doSearch, isRegex, level, requestId, search, resetDoSearch])

  if (!logs || !uiConfig) {
    return <>Loading...</>
  }

  return (
    <>
      {logs.logs.map((log) => (
        <ChildLogDetails query={query} uiConfig={uiConfig} key={log._id} log={log} indent={0} type={getLogType(log)} />
      ))}
    </>
  )
}
