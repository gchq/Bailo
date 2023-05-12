import React, { ReactElement, useMemo } from 'react'

import { LogEntry, LogType, UiConfig } from '../../types/types'
import { LogFilters } from '../FilterMenu/FilterMenu'
import ChildLogDetails from './ChildLogDetails'
import MiscLogDetails from './MiscLogDetails'

type BuildOrApprovalLogDetailsProps = {
  uiConfig: UiConfig
  log: LogEntry
  childLogs: Array<LogEntry>
  indent: number
  query: LogFilters
  filterCode: string
}

export default function BuildOrApprovalLogDetails({
  uiConfig,
  log,
  childLogs,
  indent,
  query,
  filterCode,
}: BuildOrApprovalLogDetailsProps): ReactElement {
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
