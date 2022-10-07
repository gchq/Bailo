import React, { ReactElement, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { omit } from 'lodash'
import { LogEntry } from '../types/interfaces'

import { useGetAppLogs } from '../data/admin'

export enum LogType {
  Build = 'build',
  Request = 'request',
  Misc = 'misc',
}

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

function BuildExpansion({ log, childLogs, indent }: { log: LogEntry; childLogs: Array<LogEntry>; indent: number }) {
  return <p>BuildExpansion</p>
}

function RequestExpansion({ log, childLogs, indent }: { log: LogEntry; childLogs: Array<LogEntry>; indent: number }) {
  return (
    <>
      <MiscExpansion log={log} indent={indent} />
      <>
        {childLogs
          .filter((childLog) => childLog.code !== 'request')
          .map((childLog) => (
            <LogChild key={childLog.id as string} log={childLog} indent={indent} type={LogType.Misc} />
          ))}
      </>
    </>
  )
}

function MiscExpansion({ log, indent }: { log: LogEntry; indent: number }) {
  return (
    <Typography sx={{ ml: indent * 6 }}>
      {JSON.stringify(omit(log, ['_id', 'name', 'hostname', 'pid', 'level', 'msg', 'v']), null, 2)}
    </Typography>
  )
}

function LogChild({ log, type, indent }: { log: LogEntry; type: LogType; indent: number }): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)

  const sub: { reqId?: string; buildId?: string } = {}
  if (type === LogType.Build) sub.buildId = typeof log.buildId === 'string' ? log.buildId : undefined
  if (type === LogType.Request) sub.reqId = typeof log.id === 'string' ? log.id : undefined

  const childLogs = useGetAppLogs({
    filter: ['10', '20', '30', '40', '50', '60', 'request', 'build', 'misc'],
    disabled: !shouldFetch,
    ...sub,
  }).logs

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)

    if (type !== LogType.Misc) {
      setShouldFetch(true)
    }
  }

  let expansion: ReactElement | null = null

  if (isExpanded && shouldFetch && childLogs) {
    if (type === LogType.Build) {
      expansion = <BuildExpansion log={log} childLogs={childLogs.logs} indent={indent + 1} />
    } else if (type === LogType.Request) {
      expansion = <RequestExpansion log={log} childLogs={childLogs.logs} indent={indent + 1} />
    } else {
      throw new Error('Unexpected type')
    }
  }

  if (isExpanded && !shouldFetch) {
    expansion = <MiscExpansion log={log} indent={indent + 1} />
  }

  let message: string | ReactElement = log.msg
  if (type === LogType.Request) {
    message = `${log.method} ${(log.url as string).split('?')[0]} ${log.status} ${log['response-time']}ms`
  }

  return (
    <>
      <Stack direction='row' alignItems='center' gap={1} sx={{ ml: indent * 6 }}>
        {isExpanded ? <ExpandMoreIcon onClick={toggleExpanded} /> : <ChevronRightIcon onClick={toggleExpanded} />}
        <Chip label='success' color='success' size='small' variant='outlined' />
        <Typography sx={{ p: 0, mb: 0 }} variant='body1' component='p'>
          {message}
        </Typography>
      </Stack>
      {expansion}
    </>
  )
}

export default function LogTree(): ReactElement {
  const { logs } = useGetAppLogs({ filter: ['10', '20', '30', '40', '50', '60', 'request', 'build', 'misc'] })

  if (!logs) {
    return <>Loading</>
  }

  const handleChange = () => {}

  return (
    <>
      {logs.logs.map((log) => (
        <LogChild key={log._id} log={log} indent={0} type={getLogType(log)} />
      ))}
    </>
  )
}
