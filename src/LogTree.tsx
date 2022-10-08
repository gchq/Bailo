import React, { ReactElement, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CircleIcon from '@mui/icons-material/Circle'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import { omit } from 'lodash'
import Grid from '@mui/material/Grid'

import { timeDifference } from '../utils/dateUtils'
import { LogEntry, UiConfig } from '../types/interfaces'

import { useGetAppLogs } from '../data/admin'
import { useGetUiConfig } from '../data/uiConfig'
import Link from './Link'
import { LogLevel, LogLevelValue } from './FilterMenu/LogLevelSelect'

export enum LogType {
  Build = 'build',
  Request = 'request',
  Misc = 'misc',
}

type ChipColour = 'default' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning'
function getLogLevelColour(level: number): ChipColour {
  if (level <= 30) {
    return 'info'
  }

  if (level <= 40) {
    return 'warning'
  }

  return 'error'
}

function getLogLevelText(level: number) {
  switch (level) {
    case 10:
      return 'trace'
    case 20:
      return 'debug'
    case 30:
      return 'info'
    case 40:
      return 'warn'
    case 50:
      return 'error'
    case 60:
      return 'fatal'
    default:
      return `${level}`
  }
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

function BuildExpansion({
  uiConfig,
  log,
  childLogs,
  indent,
  query,
}: {
  uiConfig: UiConfig
  log: LogEntry
  childLogs: Array<LogEntry>
  indent: number
  query: LogQuery
}) {
  return (
    <>
      <MiscExpansion log={log} indent={indent} />
      <>
        {childLogs
          .filter((childLog) => childLog.code !== 'starting_model_build')
          .map((childLog) => (
            <LogChild
              query={query}
              uiConfig={uiConfig}
              key={childLog.id as string}
              log={childLog}
              indent={indent}
              type={LogType.Misc}
            />
          ))}
      </>
    </>
  )
}

function RequestExpansion({
  uiConfig,
  log,
  childLogs,
  indent,
  query,
}: {
  uiConfig: UiConfig
  log: LogEntry
  childLogs: Array<LogEntry>
  indent: number
  query: LogQuery
}) {
  return (
    <>
      <MiscExpansion log={log} indent={indent} />
      <>
        {childLogs
          .filter((childLog) => childLog.code !== 'request')
          .map((childLog) => (
            <LogChild
              query={query}
              uiConfig={uiConfig}
              key={childLog.id as string}
              log={childLog}
              indent={indent}
              type={LogType.Misc}
            />
          ))}
      </>
    </>
  )
}

const miscIgnoreList = ['_id', 'src', 'time', 'name', 'hostname', 'pid', 'level', 'msg', 'v']
function MiscExpansion({ log, indent }: { log: LogEntry; indent: number }) {
  return <Typography sx={{ ml: indent * 6 }}>{JSON.stringify(omit(log, miscIgnoreList), null, 2)}</Typography>
}

function LogChild({
  uiConfig,
  log,
  type,
  indent,
  query,
}: {
  uiConfig: UiConfig
  log: LogEntry
  type: LogType
  indent: number
  query: LogQuery
}): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)

  const sub: { requestId?: string; buildId?: string } = {}
  if (type === LogType.Build) sub.buildId = typeof log.buildId === 'string' ? log.buildId : undefined
  if (type === LogType.Request) sub.requestId = typeof log.id === 'string' ? log.id : undefined

  const childLogs = useGetAppLogs({
    ...query,
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
      expansion = (
        <BuildExpansion query={query} uiConfig={uiConfig} log={log} childLogs={childLogs.logs} indent={indent + 1} />
      )
    } else if (type === LogType.Request) {
      expansion = (
        <RequestExpansion query={query} uiConfig={uiConfig} log={log} childLogs={childLogs.logs} indent={indent + 1} />
      )
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

  let location: ReactElement | null = null
  if (log.src) {
    const { file, line } = log.src

    let index = -1
    if (file.includes('/Bailo/')) {
      index = file.indexOf('/Bailo/server/') + 14
    }
    if (file.includes('/app')) {
      index = file.indexOf('/app/server/') + 12
    }

    const path = file.slice(index)

    location = (
      <Link href={`${`${uiConfig.development.logUrl}server/${path}`}:${line}:${1}`}>
        <Typography>
          {path}:{line}
        </Typography>
      </Link>
    )

    if (path === 'utils/logger.ts' && line === 315) {
      location = null
    }
  }

  let statusChip: ReactElement | null = null

  if (typeof log.status === 'string') {
    const status = parseInt(log.status, 10)

    if (status < 400) {
      statusChip = <Chip sx={{ height: '20px' }} label={`${status}`} color='info' size='small' variant='outlined' />
    } else if (status < 500) {
      statusChip = <Chip sx={{ height: '20px' }} label={`${status}`} color='warning' size='small' variant='outlined' />
    } else if (status < 600) {
      statusChip = <Chip sx={{ height: '20px' }} label={`${status}`} color='error' size='small' variant='filled' />
    }
  } else if (log.code === 'request') {
    statusChip = <Chip sx={{ height: '20px' }} label='fail' color='warning' size='small' variant='outlined' />
  } else {
    const logLevelText = getLogLevelText(log.level)
    const logLevelColour = getLogLevelColour(log.level)

    statusChip = (
      <Chip
        sx={{ height: '20px' }}
        label={logLevelText}
        color={logLevelColour}
        size='small'
        variant={log.level >= 50 ? 'filled' : 'outlined'}
      />
    )
  }

  const currentDate = new Date(Date.now())

  let expandable = true
  if (type === LogType.Misc) {
    if (Object.keys(omit(log, miscIgnoreList)).length === 0) {
      expandable = false
    }
  }

  let icon = <CircleIcon style={{ color: 'transparent' }} />
  if (expandable) {
    icon = isExpanded ? <ExpandMoreIcon onClick={toggleExpanded} /> : <ChevronRightIcon onClick={toggleExpanded} />
  }

  return (
    <>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Stack direction='row' alignItems='center' gap={1} sx={{ ml: indent * 6 }}>
          {icon}
          {statusChip}
          <Typography sx={{ p: 0, mb: 0 }} variant='body1' component='p'>
            {message}
          </Typography>
        </Stack>
        <Stack direction='row' alignItems='center' gap={1}>
          <Tooltip arrow placement='left' title={log.time}>
            <Typography sx={{ color: '#A9A9A9' }}>{timeDifference(currentDate, new Date(log.time))}</Typography>
          </Tooltip>
          {location}
        </Stack>
      </Grid>
      {expansion}
    </>
  )
}

interface LogQuery {
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
  const query = {
    level: LogLevelValue[logLevel],
    buildId,
    requestId,
    search,
    isRegex,
  }

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
        <LogChild query={query} uiConfig={uiConfig} key={log._id} log={log} indent={0} type={getLogType(log)} />
      ))}
    </>
  )
}
