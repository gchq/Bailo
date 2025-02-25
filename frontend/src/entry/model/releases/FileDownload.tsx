import { Done, Error, Refresh, Warning } from '@mui/icons-material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { Button, Chip, Divider, IconButton, Link, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { rerunFileScan, useGetFileScannerInfo } from 'actions/fileScanning'
import prettyBytes from 'pretty-bytes'
import { Fragment, ReactElement, useCallback, useMemo, useState } from 'react'
import AssociatedReleasesDialog from 'src/common/AssociatedReleasesDialog'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ScanState } from 'types/types'
import { formatDateString, formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

type FileDownloadProps = {
  modelId: string
  file: FileInterface | File
  showAssociatedReleases?: boolean
}

interface ChipDetails {
  label: string
  colour: 'error' | 'warning' | 'success'
  icon: ReactElement
}

export default function FileDownload({ modelId, file, showAssociatedReleases = false }: FileDownloadProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [associatedReleasesOpen, setAssociatedReleasesOpen] = useState(false)

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
      return <Chip size='small' label='Virus scan results could not be found' />
    }
    if (file.avScan.some((scan) => scan.state === ScanState.InProgress)) {
      return <Chip size='small' label='Virus scan in progress' />
    }
    return (
      <>
        <Chip
          color={chipDetails(file).colour}
          icon={chipDetails(file).icon}
          size='small'
          onClick={(e) => setAnchorEl(e.currentTarget)}
          label={chipDetails(file).label}
        />
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
  }, [anchorEl, chipDetails, file, open])

  if (isScannersError) {
    return <MessageAlert message={isScannersError.info.message} severity='error' />
  }

  if (isScannersLoading) {
    return <Loading />
  }

  return (
    <>
      {isFileInterface(file) && (
        <Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center' justifyContent='space-between'>
            <Stack sx={{ minWidth: 0, width: '100%' }}>
              <Tooltip title={file.name}>
                <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
                  <Typography noWrap textOverflow='ellipsis' overflow='hidden'>
                    {file.name}
                  </Typography>
                </Link>
              </Tooltip>
            </Stack>
            {scanners.length > 0 && (
              <Stack direction='row' alignItems='center'>
                {avChip}
                {rerunFileScanButton}
              </Stack>
            )}
            <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center' justifyContent='space-between'>
            <Stack direction='row'>
              <Typography textOverflow='ellipsis' overflow='hidden' variant='caption' sx={{ mb: 2 }}>
                Added by {<UserDisplay dn={file.createdAt.toString()} />} on
                <Typography textOverflow='ellipsis' overflow='hidden' variant='caption' fontWeight='bold'>
                  {` ${formatDateString(file.createdAt.toString())}`}
                </Typography>
              </Typography>
            </Stack>
            {showAssociatedReleases && (
              <Stack direction='row'>
                <Button startIcon={<MenuIcon />} variant='contained' onClick={() => setAssociatedReleasesOpen(true)}>
                  Associated Releases
                </Button>
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
      <AssociatedReleasesDialog
        modelId={modelId}
        open={associatedReleasesOpen}
        onClose={() => setAssociatedReleasesOpen(false)}
        file={file}
      ></AssociatedReleasesDialog>
    </>
  )
}
