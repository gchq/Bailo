import Delete from '@mui/icons-material/Delete'
import Info from '@mui/icons-material/Info'
import LocalOffer from '@mui/icons-material/LocalOffer'
import MoreVert from '@mui/icons-material/MoreVert'
import Refresh from '@mui/icons-material/Refresh'
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
import { rerunArtefactScan } from 'actions/artefactScanning'
import { deleteEntryFile, useGetModelFiles } from 'actions/entry'
import { patchFile } from 'actions/file'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import {
  CSSProperties,
  Fragment,
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Restricted from 'src/common/Restricted'
import ArtefactScanningInfoContext from 'src/contexts/artefactScanningInfoContext'
import AssociatedReleasesDialog from 'src/entry/model/releases/AssociatedReleasesDialog'
import AssociatedReleasesList from 'src/entry/model/releases/AssociatedReleasesList'
import EntryTagSelector from 'src/entry/model/releases/EntryTagSelector'
import { buildChipDetails, isAnyScanInProgress, isAnyScanResults } from 'src/entry/model/scanning/scanChipUtils'
import ScanResultDetail from 'src/entry/model/scanning/ScanResultDetail'
import useNotification from 'src/hooks/useNotification'
import { KeyedMutator } from 'swr'
import { ArtefactKind, FileInterface, isFileInterface, ReleaseInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

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
  displayName?: string
} & ClickableFileDownloadProps

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
  displayName,
}: FileDisplayProps) {
  const [anchorElMore, setAnchorElMore] = useState<HTMLElement | null>(null)
  const [anchorElScan, setAnchorElScan] = useState<HTMLElement | null>(null)
  const [anchorElFileTag, setAnchorElFileTag] = useState<HTMLButtonElement | null>(null)
  const [associatedReleasesOpen, setAssociatedReleasesOpen] = useState(false)
  const [deleteFileOpen, setDeleteFileOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [fileTagErrorMessage, setFileTagErrorMessage] = useState('')
  const [latestRelease, setLatestRelease] = useState('')

  const sendNotification = useNotification()
  const { mutateModelFiles } = useGetModelFiles(modelId)
  const router = useRouter()

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

  const chipDisplay = useMemo(() => {
    if (!isFileInterface(file)) {
      return undefined
    }
    return buildChipDetails(file.scanResults)
  }, [file])

  const scanners = useContext(ArtefactScanningInfoContext)

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
    if (!scanners) {
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
  }, [handleRerunFileScanOnClick, scanners, showMenuItems.rescanFile])

  const scanResults = isFileInterface(file) ? file.scanResults : undefined
  const scanInProgress = isAnyScanInProgress(scanResults)
  const anyScanResults = isAnyScanResults(scanResults)

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
          open={openScan && !scanInProgress && anyScanResults}
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
  }, [anchorElScan, chipDisplay, scanResults, openScan, scanInProgress, anyScanResults])

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

  return (
    <Box sx={{ ...style, p: 1 }} key={key}>
      {isFileInterface(file) && (
        <Stack spacing={1}>
          <Stack
            direction={{ sm: 'column', md: 'row' }}
            spacing={2}
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Stack
              direction={{ sm: 'column', md: 'row' }}
              spacing={2}
              sx={{
                alignItems: 'center',
                wordBreak: 'break-word',
              }}
            >
              <Tooltip title={file.name}>
                <Link
                  target='_blank'
                  href={`/api/v2/model/${modelId}/file/${file._id}/download`}
                  data-test={`fileLink-${file.name}`}
                >
                  <Typography
                    variant='h6'
                    sx={{
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {displayName ?? file.name}
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
            <Stack
              direction={{ sm: 'column', md: 'row' }}
              spacing={2}
              sx={{
                alignItems: { sm: 'center' },
              }}
            >
              {scanners && scanners.some((scanner) => scanner.artefactKind === ArtefactKind.FILE) && (
                <Stack
                  direction='row'
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                  }}
                >
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
          <Stack
            spacing={2}
            direction='row'
            sx={{
              alignItems: 'center',
            }}
          >
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
          <AssociatedReleasesList
            modelId={modelId}
            latestRelease={releases.length > 0 ? releases[0].semver : ''}
            releases={sortedAssociatedReleases}
          />
        </Box>
      </ConfirmationDialogue>
    </Box>
  )
}
