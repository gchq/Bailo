import React, { ReactElement, useMemo } from 'react'
import { LogFilters } from '@/src/FilterMenu/FilterMenu'
import { LogEntry, LogType, UiConfig } from '../../types/interfaces'
import ChildLogDetails from './ChildLogDetails'
import MiscLogDetails from './MiscLogDetails'

type BuildOrRequestLogDetailsProps = {
  uiConfig: UiConfig
  log: LogEntry
  childLogs: Array<LogEntry>
  indent: number
  query: LogFilters
  filterCode: string
}

export default function BuildOrRequestLogDetails({
  uiConfig,
  log,
  childLogs,
  indent,
  query,
  filterCode,
}: BuildOrRequestLogDetailsProps): ReactElement {
  const childLogDetails = useMemo(
    () =>
      childLogs.reduce<ReactElement[]>((logDetails, childLog) => {
        if (childLog.code !== filterCode) {
          logDetails.push(
            <ChildLogDetails
              query={query}
              uiConfig={uiConfig}
              key={childLog.id as string}
              log={childLog}
              indent={indent}
              type={LogType.Misc}
            />
          )
        }
        return logDetails
      }, []),
    [childLogs, filterCode, indent, query, uiConfig]
  )

  return (
    <>
      <MiscLogDetails log={log} indent={indent} />
      {childLogDetails}
    </>
  )
}
