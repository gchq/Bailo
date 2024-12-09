import { Done, Error, Refresh, Warning } from '@mui/icons-material'
import { Chip, Divider, Grid, IconButton, Link, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { rerunFileScan, useGetFileScannerInfo } from 'actions/fileScanning'
import prettyBytes from 'pretty-bytes'
import { Fragment, ReactElement, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ScanState } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

type FileDownloadProps = {
  modelId: string
  file: FileInterface | File
}

interface ChipDetails {
  label: string
  colour: 'error' | 'warning' | 'success'
  icon: ReactElement
}

export default function FileDownload({ modelId, file }: FileDownloadProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const sendNotification = useNotification()
  const { scanners, isScannersLoading, isScannersError } = useGetFileScannerInfo()

  const open = Boolean(anchorEl)

  const threatsFound = (file: FileInterface) => {
    if (file.avScan === undefined) {
      return 0
    }
    return file.avScan.reduce((acc, scan) => {
      return scan.viruses ? scan.viruses.length + acc : acc
    }, 0)
  }

  const chipDetails = useCallback((file: FileInterface): ChipDetails => {
    if (file.avScan === undefined) {
      return { label: 'Virus scan results could not be found', colour: 'warning', icon: <Warning /> }
    }
    if (file.avScan.some((scan) => scan.state === ScanState.Error)) {
      return { label: 'One or more virus scanning tools failed', colour: 'warning', icon: <Warning /> }
    }
    if (threatsFound(file)) {
      return {
        label: `Virus scan failed: ${plural(threatsFound(file), 'threat')} found`,
        colour: 'error',
        icon: <Error />,
      }
    }
    return { label: 'Virus scan passed', colour: 'success', icon: <Done /> }
  }, [])

  const handleRerunFileScanOnClick = useCallback(async () => {
    const res = await rerunFileScan(modelId, (file as FileInterface)._id)
    if (!res.ok) {
      sendNotification({
        variant: 'error',
        msg: await getErrorMessage(res),
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    } else {
      sendNotification({
        variant: 'success',
        msg: `${file.name} is being rescanned`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }, [file, modelId, sendNotification])

  const rerunFileScanButton = useMemo(() => {
    return (
      <Tooltip title='Rerun file scan'>
        <IconButton onClick={handleRerunFileScanOnClick}>
          <Refresh />
        </IconButton>
      </Tooltip>
    )
  }, [handleRerunFileScanOnClick])

  const avChip = useMemo(() => {
    if (
      !isFileInterface(file) ||
      file.avScan === undefined ||
      file.avScan.every((scan) => scan.state === ScanState.NotScanned)
    ) {
      return (
        <Stack direction='row' alignItems='center'>
          <Chip size='small' label='Virus scan results could not be found' />
          {rerunFileScanButton}
        </Stack>
      )
    }
    if (file.avScan.some((scan) => scan.state === ScanState.InProgress)) {
      return (
        <Stack direction='row' alignItems='center'>
          <Chip size='small' label='Virus scan in progress' />
          {rerunFileScanButton}
        </Stack>
      )
    }
    return (
      <>
        <Stack direction='row' alignItems='center'>
          <Chip
            color={chipDetails(file).colour}
            icon={chipDetails(file).icon}
            size='small'
            onClick={(e) => setAnchorEl(e.currentTarget)}
            label={chipDetails(file).label}
          />
          {rerunFileScanButton}
        </Stack>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Stack spacing={2} sx={{ p: 2 }} divider={<Divider flexItem />}>
            {file.avScan.map((scanResult) => (
              <Fragment key={scanResult.toolName}>
                {scanResult.isInfected ? (
                  <Stack spacing={2}>
                    <Stack spacing={1} direction='row'>
                      <Error color='error' />
                      <Typography>
                        <span style={{ fontWeight: 'bold' }}>{scanResult.toolName}</span> found the following threats:
                      </Typography>
                    </Stack>
                    {scanResult.scannerVersion && (
                      <Chip size='small' sx={{ width: 'fit-content' }} label={scanResult.scannerVersion} />
                    )}
                    <Typography>Last ran at: {formatDateTimeString(scanResult.lastRunAt)}</Typography>
                    <ul>{scanResult.viruses && scanResult.viruses.map((virus) => <li key={virus}>{virus}</li>)}</ul>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Stack spacing={1} direction='row'>
                      {scanResult.state === 'error' ? <Warning color='warning' /> : <Done color='success' />}
                      <Typography>
                        <span style={{ fontWeight: 'bold' }}>{scanResult.toolName}</span>
                        {scanResult.state === 'error' ? ' was not able to be run' : ' did not find any threats'}
                      </Typography>
                    </Stack>
                    {scanResult.scannerVersion && (
                      <Chip size='small' sx={{ width: 'fit-content' }} label={scanResult.scannerVersion} />
                    )}
                    <Typography>Last ran at: {formatDateTimeString(scanResult.lastRunAt)}</Typography>
                  </Stack>
                )}
              </Fragment>
            ))}
          </Stack>
        </Popover>
      </>
    )
  }, [anchorEl, chipDetails, file, open, rerunFileScanButton])

  if (isScannersError) {
    return <MessageAlert message={isScannersError.info.message} severity='error' />
  }

  if (isScannersLoading) {
    return <Loading />
  }

  return (
    <>
      {isFileInterface(file) && (
        <Grid container alignItems='center' key={file.name}>
          <Grid item xs={11}>
            <Stack direction='row' alignItems='center' spacing={2}>
              <Tooltip title={file.name}>
                <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
                  <Typography noWrap textOverflow='ellipsis'>
                    {file.name}
                  </Typography>
                </Link>
              </Tooltip>
              {scanners.length > 0 && avChip}
            </Stack>
          </Grid>
          <Grid item xs={1} textAlign='right'>
            <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
          </Grid>
        </Grid>
      )}
    </>
  )
}
