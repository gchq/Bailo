import { Done, Error, InfoOutlined, Refresh, Warning } from '@mui/icons-material'
import { Chip, Divider, IconButton, Link, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { rerunFileScan, useGetFileScannerInfo } from 'actions/fileScanning'
import { useGetReleasesForModelId } from 'actions/release'
import prettyBytes from 'pretty-bytes'
import { Fragment, ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import AssociatedReleasesDialog from 'src/entry/model/releases/AssociatedReleasesDialog'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ScanState } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
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
  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(modelId)
  const [latestRelease, setLatestRelease] = useState('')

  const sortedAssociatedReleases = useMemo(
    () =>
      releases
        .filter((release) => isFileInterface(file) && release.fileIds.includes(file._id))
        .sort(sortByCreatedAtDescending),
    [file, releases],
  )

  useEffect(() => {
    if (releases.length > 0 && sortedAssociatedReleases.length > 0) {
      setLatestRelease(releases[0].semver)
    }
  }, [releases, sortedAssociatedReleases])

  const [chipDisplay, setChipDisplay] = useState<ChipDetails | undefined>(undefined)

  const updateChipDetails = useCallback(() => {
    if (!isFileInterface(file) || file.avScan === undefined) {
      setChipDisplay({ label: 'Virus scan results could not be found', colour: 'warning', icon: <Warning /> })
    }
    if (
      isFileInterface(file) &&
      file.avScan !== undefined &&
      file.avScan.some((scan) => scan.state === ScanState.Error)
    ) {
      setChipDisplay({ label: 'One or more virus scanning tools failed', colour: 'warning', icon: <Warning /> })
    }
    if (threatsFound(file as FileInterface)) {
      setChipDisplay({
        label: `Virus scan failed: ${plural(threatsFound(file as FileInterface), 'threat')} found`,
        colour: 'error',
        icon: <Error />,
      })
    } else {
      setChipDisplay({ label: 'Virus scan passed', colour: 'success', icon: <Done /> })
    }
  }, [file])

  useEffect(() => {
    if (chipDisplay === undefined) {
      updateChipDetails()
    }
  }, [updateChipDetails, chipDisplay])

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

  const handleRerunFileScanOnClick = useCallback(async () => {
    const res = await rerunFileScan(modelId, (file as FileInterface)._id)
    setChipDisplay({ label: 'File is being rescanned...', colour: 'warning', icon: <Warning /> })
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
        <IconButton color='primary' onClick={handleRerunFileScanOnClick}>
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
          color={chipDisplay ? chipDisplay.colour : 'warning'}
          icon={chipDisplay ? chipDisplay.icon : <Warning />}
          size='small'
          onClick={(e) => setAnchorEl(e.currentTarget)}
          label={chipDisplay ? chipDisplay.label : 'Virus scan results could not be found'}
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
  }, [anchorEl, chipDisplay, file, open])

  if (isFileInterface(file) && !file.complete) {
    return (
      <Typography>
        <span style={{ fontWeight: 'bold' }}>{file.name}</span> is not currently available
      </Typography>
    )
  }

  if (isScannersError) {
    return <MessageAlert message={isScannersError.info.message} severity='error' />
  }

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isScannersLoading || isReleasesLoading) {
    return <Loading />
  }

  return (
    <>
      {isFileInterface(file) && (
        <Stack>
          <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} alignItems='center' justifyContent='space-between'>
            <Stack alignItems={{ sm: 'center' }}>
              <Tooltip title={file.name}>
                <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
                  <Typography textOverflow='ellipsis' overflow='hidden'>
                    {file.name}
                  </Typography>
                </Link>
              </Tooltip>
            </Stack>
            <Stack alignItems={{ sm: 'center' }} direction={{ sm: 'column', md: 'row' }} spacing={2}>
              {showAssociatedReleases && (
                <Chip
                  icon={<InfoOutlined />}
                  color='primary'
                  size='small'
                  onClick={() => setAssociatedReleasesOpen(true)}
                  label='View Associated Releases'
                />
              )}
              {scanners.length > 0 && (
                <Stack direction='row' alignItems='center'>
                  {avChip}
                  {rerunFileScanButton}
                  <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
          <Typography variant='caption'>
            Uploaded on
            <span style={{ fontWeight: 'bold' }}>{` ${formatDateString(file.createdAt.toString())}`}</span>
          </Typography>
        </Stack>
      )}
      <AssociatedReleasesDialog
        modelId={modelId}
        open={associatedReleasesOpen}
        onClose={() => setAssociatedReleasesOpen(false)}
        file={file}
        latestRelease={latestRelease}
        sortedAssociatedReleases={sortedAssociatedReleases}
      />
    </>
  )
}
