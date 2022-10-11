import React, { ReactElement, useMemo } from 'react'
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
  level: number
  buildId: string
  requestId: string
  search: string
  isRegex: boolean
}

interface LogTreeProps {
  logLevel: LogLevel
  buildId: string
  requestId: string
  search: string
  isRegex: boolean
}

export default function LogTree({ logLevel, buildId, requestId, search, isRegex }: LogTreeProps): ReactElement {
  const query = useMemo(
    () => ({
      level: logLevel,
      buildId,
      requestId,
      search,
      isRegex,
    }),
    [buildId, isRegex, logLevel, requestId, search]
  )

  const { logs } = useGetAppLogs({
    ...query,
    filter: ['request', 'build', 'misc'],
  })
  const { uiConfig } = useGetUiConfig()

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
