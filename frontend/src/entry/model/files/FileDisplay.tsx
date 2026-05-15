import {
  BlockOutlined,
  Delete,
  Done,
  Error as ErrorIcon,
  HourglassTop,
  Info,
  LocalOffer,
  MoreVert,
  Refresh,
  Warning,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { rerunArtefactScan, useGetArtefactScannerInfo } from 'actions/artefactScanning'
import { deleteEntryFile, useGetModelFiles } from 'actions/entry'
import { patchFile } from 'actions/file'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import {
  CSSProperties,
  Fragment,
  MouseEvent,
  ReactElement,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import AssociatedReleasesDialog from 'src/entry/model/releases/AssociatedReleasesDialog'
import AssociatedReleasesList from 'src/entry/model/releases/AssociatedReleasesList'
import EntryTagSelector from 'src/entry/model/releases/EntryTagSelector'
import useNotification from 'src/hooks/useNotification'
import { KeyedMutator } from 'swr'
import {
  ArtefactKind,
  ArtefactScanState,
  ArtefactScanStateKeys,
  ClamAVScanSummary,
  FileInterface,
  isFileInterface,
  ModelScanSummary,
  ReleaseInterface,
  ScanResultInterface,
} from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

export type MutateReleases = KeyedMutator<{ releases: ReleaseInterface[] }>
export type MutateFiles = KeyedMutator<{ files: FileInterface[] }>

type ClickableFileDownloadProps =
  | {
      isClickable: true
      activeFileTag: string
      activeFileTagOnChange: (newFileTag: string) => void
    }
  | {
      isClickable?: false
      activeFileTag?: string
      activeFileTagOnChange?: (newFileTag: string) => void
    }

type FileDisplayProps = {
  modelId: string
  file: FileInterface
  showMenuItems?: {
    associatedReleases?: boolean
    deleteFile?: boolean
    rescanFile?: boolean
  }
  mutator?: MutateReleases | MutateFiles
  hideTags?: boolean
  style?: CSSProperties
  key?: string
  releases: ReleaseInterface[]
} & ClickableFileDownloadProps

interface ChipDetails {
  label: string
  colour: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  icon: ReactElement
}

const SCAN_STATE_PRECEDENCE: ArtefactScanStateKeys[] = [
  ArtefactScanState.InProgress,
  ArtefactScanState.NotScanned,
  ArtefactScanState.Error,
  ArtefactScanState.Skipped,
  ArtefactScanState.Complete,
]

function countFindings(scanResults: ScanResultInterface[] | undefined): number {
  if (!scanResults) {
    return 0
  }
  return scanResults.reduce((acc, scan) => acc + (scan.summary?.length ?? 0), 0)
}

/**
 * Returns the worst-case state across all scan results, or `undefined` if there are no scan results at all.
 */
function getWorstScanState(scanResults: ScanResultInterface[] | undefined): ArtefactScanStateKeys | undefined {
  if (!scanResults || scanResults.length === 0) {
    return undefined
  }
  const states = new Set(scanResults.map((r) => r.state))
  return SCAN_STATE_PRECEDENCE.find((state) => states.has(state))
}

/**
 * Derive the chip details from the worst-case scan state and total findings.
 */
function buildChipDetails(scanResults: ScanResultInterface[] | undefined): ChipDetails {
  if (scanResults === undefined) {
    return { label: 'Scan results could not be found', colour: 'warning', icon: <Warning /> }
  }

  const worst = getWorstScanState(scanResults)
  const findings = countFindings(scanResults)
  const worstCount = scanResults.filter((s) => s.state === worst).length

  switch (worst) {
    case ArtefactScanState.InProgress: {
      return {
        label: `${plural(worstCount, 'scan')} remaining`,
        colour: 'warning',
        icon: <HourglassTop />,
      }
    }
    case ArtefactScanState.NotScanned:
      return { label: `${worstCount} not scanned`, colour: 'warning', icon: <Warning /> }
    case ArtefactScanState.Error:
      return findings > 0
        ? {
            label: `${plural(findings, 'finding')} detected`,
            colour: 'error',
            icon: <ErrorIcon />,
          }
        : { label: `${plural(worstCount, 'scanning tool')} failed`, colour: 'error', icon: <ErrorIcon /> }
    case ArtefactScanState.Skipped:
      return { label: `${plural(worstCount, 'scan')} skipped`, colour: 'default', icon: <BlockOutlined /> }
    case ArtefactScanState.Complete:
      return findings > 0
        ? {
            label: `${plural(findings, 'finding')} detected`,
            colour: 'error',
            icon: <ErrorIcon />,
          }
        : { label: 'No issues found', colour: 'success', icon: <Done /> }
    default:
      return {
        label: 'There was a problem fetching the file scan results',
        colour: 'error',
        icon: <Warning />,
      }
  }
}

/**
 * Renders a single scanner's result block inside the popover.
 * Uses the scanner's own state (not the aggregated state) so each row shows the correct icon/wording for that individual tool.
 */
function ScanResultDetail({ scanResult }: { scanResult: ScanResultInterface }) {
  const hasFindings = !!scanResult.summary && scanResult.summary.length > 0
  const { state, toolName, scannerVersion, lastRunAt, summary } = scanResult

  const renderHeader = (): ReactElement => {
    if (hasFindings) {
      if (state === ArtefactScanState.Skipped) {
        return (
          <>
            <BlockOutlined color='action' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> was skipped:
            </Typography>
          </>
        )
      }
      return (
        <>
          <ErrorIcon color='error' />
          <Typography>
            <span style={{ fontWeight: 'bold' }}>{toolName}</span> found the following:
          </Typography>
        </>
      )
    }

    switch (state) {
      case ArtefactScanState.InProgress:
        return (
          <>
            <HourglassTop color='warning' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> is currently running
            </Typography>
          </>
        )
      case ArtefactScanState.NotScanned:
      case ArtefactScanState.Error:
        return (
          <>
            <Warning color='warning' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> could not be run
            </Typography>
          </>
        )
      case ArtefactScanState.Skipped:
        return (
          <>
            <BlockOutlined color='action' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> was skipped
            </Typography>
          </>
        )
      case ArtefactScanState.Complete:
      default:
        return (
          <>
            <Done color='success' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> found no issues
            </Typography>
          </>
        )
    }
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1} direction='row' alignItems='center'>
        {renderHeader()}
      </Stack>
      {scannerVersion && (
        <Chip
          size='small'
          variant='outlined'
          sx={{ width: 'fit-content' }}
          label={`Scanner version: ${scannerVersion}`}
        />
      )}
      <Typography>Last ran at: {formatDateTimeString(lastRunAt)}</Typography>
      {hasFindings && summary && (
        <ul>
          {summary.map((vulnerability) => {
            if (typeof vulnerability === 'string') {
              return <li key={vulnerability}>{vulnerability}</li>
            }
            if (toolName === 'ModelScan') {
              const v = vulnerability as ModelScanSummary
              return (
                <li key={v.vulnerabilityDescription}>
                  <span style={{ fontWeight: 'bold' }}>{`${String(v.severity).toUpperCase()}:`}</span>{' '}
                  {(vulnerability as ModelScanSummary).vulnerabilityDescription}
                </li>
              )
            }
            const v = vulnerability as ClamAVScanSummary
            return <li key={v.virus}>{`Virus found: ${v.virus}`}</li>
          })}
        </ul>
      )}
    </Stack>
  )
}

export default function FileDisplay({
  modelId,
  file,
  showMenuItems = { associatedReleases: false, deleteFile: false, rescanFile: false },
  mutator = undefined,
  hideTags = false,
  isClickable = false,
  activeFileTag = '',
  activeFileTagOnChange,
  style = {},
  key = '',
  releases,
}: FileDisplayProps) {
  const [anchorElMore, setAnchorElMore] = useState<HTMLElement | null>(null)
  const [anchorElScan, setAnchorElScan] = useState<HTMLElement | null>(null)
  const [anchorElFileTag, setAnchorElFileTag] = useState<HTMLButtonElement | null>(null)
  const [associatedReleasesOpen, setAssociatedReleasesOpen] = useState(false)
  const [deleteFileOpen, setDeleteFileOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [fileTagErrorMessage, setFileTagErrorMessage] = useState('')

  const sendNotification = useNotification()
  const { mutateModelFiles } = useGetModelFiles(modelId)
  const router = useRouter()

  const [latestRelease, setLatestRelease] = useState('')

  const sortedAssociatedReleases = useMemo(
    () =>
      releases
        .filter((release) => isFileInterface(file) && release.fileIds.includes(file._id))
        .sort(sortByCreatedAtDescending),
    [file, releases],
  )

  const onLatestReleaseChange = useEffectEvent((semver: string) => {
    setLatestRelease(semver)
  })

  useEffect(() => {
    if (releases.length > 0 && sortedAssociatedReleases.length > 0) {
      onLatestReleaseChange(releases[0].semver)
    }
  }, [releases, sortedAssociatedReleases])

  const handleDeleteConfirm = useCallback(async () => {
    if (!isFileInterface(file) || isDeleting) {
      return
    }
    try {
      setIsDeleting(true)
      setDeleteErrorMessage('')

      const res = await deleteEntryFile(modelId, file._id)
      if (!res.ok) {
        setDeleteErrorMessage(await getErrorMessage(res))
        return
      }

      sendNotification({
        variant: 'success',
        msg: `File ${file.name} deleted`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })

      mutateModelFiles()
      setDeleteFileOpen(false)
      router.push(`/model/${modelId}?tab=files`)
    } catch (err) {
      setDeleteErrorMessage(`Failed to delete file.\n${err}`)
    } finally {
      setIsDeleting(false)
    }
  }, [file, isDeleting, modelId, router, mutateModelFiles, sendNotification])

  const handleFileMoreButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorElMore(event.currentTarget)
  }

  const handleFileMoreButtonClose = () => setAnchorElMore(null)

  const chipDisplay = useMemo<ChipDetails | undefined>(() => {
    if (!isFileInterface(file)) {
      return undefined
    }
    return buildChipDetails(file.scanResults)
  }, [file])

  const { scanners, isScannersLoading, isScannersError } = useGetArtefactScannerInfo()

  const openMore = Boolean(anchorElMore)
  const openScan = Boolean(anchorElScan)

  const handleRerunFileScanOnClick = useCallback(async () => {
    if (!isFileInterface(file)) {
      return
    }
    const res = await rerunArtefactScan(modelId, file._id)
    if (!res.ok) {
      sendNotification({
        variant: 'error',
        msg: await getErrorMessage(res),
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    } else {
      sendNotification({
        variant: 'success',
        msg: `Rescan started for ${file.name}`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      mutator?.()
    }
  }, [file, modelId, sendNotification, mutator])

  const rerunFileScanButton = useMemo(() => {
    if (!scanners || isScannersError) {
      return null
    }
    if (!scanners.some((scanner) => scanner.artefactKind === ArtefactKind.FILE)) {
      return null
    }
    return (
      <MenuItem hidden={!showMenuItems.rescanFile} onClick={handleRerunFileScanOnClick}>
        <ListItemIcon>
          <Refresh color='primary' fontSize='small' />
        </ListItemIcon>
        <ListItemText>Rerun file scan</ListItemText>
      </MenuItem>
    )
  }, [handleRerunFileScanOnClick, scanners, isScannersError, showMenuItems.rescanFile])

  const scanResults = isFileInterface(file) ? file.scanResults : undefined
  const isAnyScanInProgress = scanResults?.some((res) => res.state === ArtefactScanState.InProgress) ?? false

  const scanResultChip = useMemo(() => {
    if (!chipDisplay) {
      return <Skeleton variant='text' sx={{ fontSize: '1rem', width: '150px' }} />
    }
    return (
      <>
        <Chip
          color={chipDisplay.colour}
          icon={chipDisplay.icon}
          onClick={(e) => setAnchorElScan(e.currentTarget)}
          label={chipDisplay.label}
        />
        <Popover
          // Do not open popover if scans are in progress as there aren't yet results
          open={openScan && !isAnyScanInProgress}
          anchorEl={anchorElScan}
          onClose={() => setAnchorElScan(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Stack spacing={2} sx={{ p: 2 }} divider={<Divider flexItem />}>
            {scanResults?.map((scanResult) => (
              <Fragment key={scanResult.toolName}>
                <ScanResultDetail scanResult={scanResult} />
              </Fragment>
            ))}
          </Stack>
        </Popover>
      </>
    )
  }, [anchorElScan, chipDisplay, scanResults, openScan, isAnyScanInProgress])

  const handleFileTagSelectorOnChange = async (newTags: string[]) => {
    setFileTagErrorMessage('')
    if (newTags.includes('')) {
      setFileTagErrorMessage('Tags must have at least one character')
      return
    }
    const res = await patchFile(modelId, file._id, { tags: newTags.filter((t) => t !== '') })
    mutateModelFiles()

    if (res.status && res.status >= 200 && res.status < 300) {
      mutateModelFiles()
      return
    }
    if (typeof res.data === 'string' && res.data.length > 0) {
      setFileTagErrorMessage(res.data)
    } else {
      setFileTagErrorMessage('Failed to update file tags. Please try again.')
    }
  }

  const handleFileTagOnClick = (fileTag: string) => {
    if (!activeFileTagOnChange) {
      return
    }
    activeFileTagOnChange(fileTag === activeFileTag ? '' : fileTag)
  }

  if (isFileInterface(file) && !file.complete) {
    return (
      <Typography>
        <span style={{ fontWeight: 'bold' }}>{file.name}</span> is not currently available
      </Typography>
    )
  }

  const showMenu = () =>
    Object.keys(showMenuItems).length > 0 && Object.values(showMenuItems).some((item) => item === true)

  if (isScannersLoading) {
    return <Loading />
  }

  return (
    <Box sx={{ ...style, p: 1 }} key={key}>
      {isFileInterface(file) && (
        <Stack spacing={1}>
          <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} alignItems='center' justifyContent='space-between'>
            <Stack
              direction={{ sm: 'column', md: 'row' }}
              spacing={2}
              alignItems='center'
              sx={{ wordBreak: 'break-word' }}
            >
              <Tooltip title={file.name}>
                <Link
                  target='_blank'
                  href={`/api/v2/model/${modelId}/file/${file._id}/download`}
                  data-test={`fileLink-${file.name}`}
                >
                  <Typography textOverflow='ellipsis' overflow='hidden' variant='h6'>
                    {file.name}
                  </Typography>
                </Link>
              </Tooltip>
              <Typography variant='caption' sx={{ width: 'max-content' }}>
                {prettyBytes(file.size)}
              </Typography>
              <Typography variant='caption'>
                Uploaded on
                <span style={{ fontWeight: 'bold' }}>{` ${formatDateTimeString(file.createdAt.toString())}`}</span>
              </Typography>
            </Stack>
            <Stack alignItems={{ sm: 'center' }} direction={{ sm: 'column', md: 'row' }} spacing={2}>
              {scanners && scanners.some((scanner) => scanner.artefactKind === ArtefactKind.FILE) && (
                <Stack direction='row' spacing={1} alignItems='center'>
                  {scanResultChip}
                </Stack>
              )}
              <Stack>
                {showMenu() && (
                  <>
                    <IconButton aria-label='toggle file options menu' onClick={handleFileMoreButtonClick}>
                      <MoreVert color='primary' />
                    </IconButton>
                    <Menu anchorEl={anchorElMore} open={openMore} onClose={handleFileMoreButtonClose}>
                      {showMenuItems.associatedReleases && (
                        <MenuItem
                          onClick={() => {
                            handleFileMoreButtonClose()
                            setAssociatedReleasesOpen(true)
                          }}
                        >
                          <ListItemIcon>
                            <Info color='primary' fontSize='small' />
                          </ListItemIcon>
                          <ListItemText>Associated releases</ListItemText>
                        </MenuItem>
                      )}
                      {showMenuItems.deleteFile && (
                        <MenuItem
                          onClick={() => {
                            handleFileMoreButtonClose()
                            setDeleteFileOpen(true)
                            setDeleteErrorMessage('')
                          }}
                        >
                          <ListItemIcon>
                            <Delete color='primary' fontSize='small' />
                          </ListItemIcon>
                          <ListItemText>Delete file</ListItemText>
                        </MenuItem>
                      )}
                      {showMenuItems.rescanFile && rerunFileScanButton}
                    </Menu>
                  </>
                )}
              </Stack>
            </Stack>
          </Stack>
          <Stack spacing={2} direction='row' alignItems='center'>
            {!hideTags && (
              <>
                <Restricted action='editEntry' fallback={<></>}>
                  <Button
                    sx={{ width: 'fit-content' }}
                    size='small'
                    startIcon={<LocalOffer />}
                    onClick={(event) => setAnchorElFileTag(event.currentTarget)}
                  >
                    Apply file tags
                  </Button>
                </Restricted>
                <Box sx={{ whiteSpace: 'pre-wrap' }}>
                  {file.tags.map((fileTag) =>
                    isClickable ? (
                      <Chip
                        key={fileTag}
                        label={fileTag}
                        sx={{ width: 'fit-content', m: 0.5 }}
                        onClick={() => handleFileTagOnClick(fileTag)}
                        color={activeFileTag === fileTag ? 'secondary' : undefined}
                      />
                    ) : (
                      <Chip key={fileTag} label={fileTag} sx={{ width: 'fit-content', m: 0.5 }} />
                    ),
                  )}
                </Box>
                <EntryTagSelector
                  anchorEl={anchorElFileTag}
                  setAnchorEl={setAnchorElFileTag}
                  onChange={handleFileTagSelectorOnChange}
                  tags={file.tags || []}
                  errorText={fileTagErrorMessage}
                />
              </>
            )}
          </Stack>
        </Stack>
      )}
      <AssociatedReleasesDialog
        modelId={modelId}
        open={associatedReleasesOpen}
        onClose={() => setAssociatedReleasesOpen(false)}
        latestRelease={latestRelease}
        sortedAssociatedReleases={sortedAssociatedReleases}
      />
      <ConfirmationDialogue
        open={deleteFileOpen}
        title='Delete File'
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteFileOpen(false)
          }
        }}
        errorMessage={deleteErrorMessage}
        confirmDisabled={isDeleting}
        confirmLoading={isDeleting}
        dialogMessage={
          sortedAssociatedReleases.length > 0
            ? 'Deleting this file will affect the following releases:'
            : 'Deleting this file will not affect any existing releases'
        }
      >
        <Box sx={{ pt: 2 }}>
          <AssociatedReleasesList modelId={modelId} latestRelease={latestRelease} releases={sortedAssociatedReleases} />
        </Box>
      </ConfirmationDialogue>
    </Box>
  )
}
