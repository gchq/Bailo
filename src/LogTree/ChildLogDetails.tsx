import React, { ReactElement, useCallback, useMemo, useState } from 'react'
import { omit } from 'lodash'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CircleIcon from '@mui/icons-material/Circle'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Chip, { ChipProps } from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import MiscLogDetails, { miscIgnoreList } from '@/src/LogTree/MiscLogDetails'
import Link from '@/src/Link'
import getLogLevelLabel from '@/utils/getLogLevelLabel'
import { timeDifference } from '@/utils/dateUtils'
import BuildOrApprovalLogDetails from '@/src/LogTree/BuildOrApprovalLogDetails'
import { LogFilters } from '@/src/FilterMenu/FilterMenu'
import { useTheme, darken } from '@mui/material/styles'
import { useGetAppLogs } from '../../data/admin'
import { LogEntry, LogLevel, LogType, UiConfig } from '../../types/interfaces'

const getLogLevelColour = (level: number): ChipProps['color'] => {
  if (level <= LogLevel.INFO) {
    return 'info'
  }

  if (level <= LogLevel.WARN) {
    return 'warning'
  }

  return 'error'
}

type ChildLogDetailsProps = {
  uiConfig: UiConfig
  log: LogEntry
  type: LogType
  indent: number
  query: LogFilters
}

export default function ChildLogDetails({ uiConfig, log, type, indent, query }: ChildLogDetailsProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)
  const theme = useTheme()

  const buildId = useMemo(
    () => (type === LogType.Build && typeof log.buildId === 'string' ? log.buildId : undefined),
    [log.buildId, type]
  )
  const approvalId = useMemo(
    () => (type === LogType.Approval && typeof log.id === 'string' ? log.id : undefined),
    [log.id, type]
  )

  const childLogs = useGetAppLogs({
    ...query,
    disabled: !shouldFetch,
    buildId,
    approvalId,
  }).logs

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded)

    if (type !== LogType.Misc) {
      setShouldFetch(true)
    }
  }, [isExpanded, type])

  const expansion = useMemo(() => {
    if (isExpanded && shouldFetch && childLogs) {
      if (type === LogType.Build || type === LogType.Approval) {
        return (
          <BuildOrApprovalLogDetails
            query={query}
            uiConfig={uiConfig}
            log={log}
            childLogs={childLogs.logs}
            indent={indent + 1}
            filterCode={type === LogType.Build ? 'starting_model_build' : 'approval'}
          />
        )
      }
      throw new Error('Unexpected log type')
    }

    if (isExpanded && !shouldFetch) {
      return <MiscLogDetails log={log} indent={indent + 1} />
    }

    return null
  }, [childLogs, indent, isExpanded, log, query, shouldFetch, type, uiConfig])

  const message = useMemo(() => {
    if (type === LogType.Approval) {
      return `${log.method} ${(log.url as string).split('?')[0]} ${log['response-time']}ms`
    }
    return log.msg
  }, [log, type])

  const location = useMemo(() => {
    if (!log.src) return null

    const { file, line } = log.src

    let index = -1
    if (file.includes('/Bailo/')) {
      index = file.indexOf('/Bailo/server/') + 14
    }
    if (file.includes('/app')) {
      index = file.indexOf('/app/server/') + 12
    }

    const path = file.slice(index)

    if (path === 'utils/logger.ts' && line === 315) {
      return null
    }

    return (
      <Link href={`${`${uiConfig.development.logUrl}server/${path}`}:${line}:${1}`}>
        <Typography variant='body1'>
          {path}:{line}
        </Typography>
      </Link>
    )
  }, [log.src, uiConfig.development.logUrl])

  const statusChip = useMemo(() => {
    if (typeof log.status === 'string') {
      const status = parseInt(log.status, 10)

      if (status < 400) {
        return <Chip sx={{ height: '20px' }} label={`${status}`} color='info' size='small' variant='outlined' />
      }
      if (status < 500) {
        return <Chip sx={{ height: '20px' }} label={`${status}`} color='warning' size='small' variant='outlined' />
      }
      if (status < 600) {
        return <Chip sx={{ height: '20px' }} label={`${status}`} color='error' size='small' variant='filled' />
      }
    } else if (log.code === 'approval') {
      return <Chip sx={{ height: '20px' }} label='fail' color='warning' size='small' variant='outlined' />
    } else {
      const logLevelLabel = getLogLevelLabel(log.level)
      const logLevelColour = getLogLevelColour(log.level)

      return (
        <Chip
          sx={{ height: '20px' }}
          label={logLevelLabel}
          color={logLevelColour}
          size='small'
          variant={log.level >= LogLevel.ERROR ? 'filled' : 'outlined'}
        />
      )
    }

    return null
  }, [log.code, log.level, log.status])

  const isExpandable = useMemo(
    () => !(type === LogType.Misc && Object.keys(omit(log, miscIgnoreList)).length === 0),
    [log, type]
  )

  const icon = useMemo(() => {
    if (isExpandable) {
      return isExpanded ? <ExpandMoreIcon onClick={toggleExpanded} /> : <ChevronRightIcon onClick={toggleExpanded} />
    }
    return <CircleIcon style={{ color: 'transparent' }} />
  }, [isExpandable, isExpanded, toggleExpanded])

  const currentDate = new Date(Date.now())

  return (
    <Grid container sx={{ mb: 1, '&:hover': { backgroundColor: darken(theme.palette.container.main, 0.1) } }}>
      <Grid item xs={12}>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Stack direction='row' alignItems='center' spacing={1} sx={{ ml: indent * 6 }}>
            {icon}
            {statusChip}
            <Typography component='p'>{message}</Typography>
          </Stack>
          <Stack direction='row' alignItems='center' spacing={1}>
            <Tooltip arrow placement='left' title={log.time}>
              <Typography sx={{ color: '#A9A9A9' }}>{timeDifference(currentDate, new Date(log.time))}</Typography>
            </Tooltip>
            {location}
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        {expansion}
      </Grid>
    </Grid>
  )
}
