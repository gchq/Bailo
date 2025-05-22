import { Delete, Done, Error, Info, LocalOffer, MoreVert, Refresh, Warning } from '@mui/icons-material'
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
import { patchFile } from 'actions/file'
import { rerunFileScan, useGetFileScannerInfo } from 'actions/fileScanning'
import { deleteModelFile, useGetModelFiles } from 'actions/model'
import { useGetReleasesForModelId } from 'actions/release'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import { CSSProperties, Fragment, MouseEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import AssociatedReleasesDialog from 'src/entry/model/releases/AssociatedReleasesDialog'
import AssociatedReleasesList from 'src/entry/model/releases/AssociatedReleasesList'
import FileTagSelector from 'src/entry/model/releases/FileTagSelector'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { KeyedMutator } from 'swr'
import { FileInterface, isFileInterface, ReleaseInterface, ScanState } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { plural } from 'utils/stringUtils'

export type MutateReleases = KeyedMutator<{
  releases: ReleaseInterface[]
}>

export type MutateFiles = KeyedMutator<{
  files: FileInterface[]
}>

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
} & ClickableFileDownloadProps

interface ChipDetails {
  label: string
  colour: 'error' | 'warning' | 'success'
  icon: ReactElement
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
}: FileDisplayProps) {
  const [anchorElMore, setAnchorElMore] = useState<HTMLElement | null>(null)
  const [anchorElScan, setAnchorElScan] = useState<HTMLElement | null>(null)
  const [anchorElFileTag, setAnchorElFileTag] = useState<HTMLButtonElement | null>(null)
  const [associatedReleasesOpen, setAssociatedReleasesOpen] = useState(false)
  const [deleteFileOpen, setDeleteFileOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [fileTagErrorMessage, setFileTagErrorMessage] = useState('')

  const { mutateEntryFiles } = useGetModelFiles(modelId)
  const router = useRouter()

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
  }, [releases, setLatestRelease, sortedAssociatedReleases])

  const handleDeleteConfirm = useCallback(async () => {
    if (isFileInterface(file)) {
      const res = await deleteModelFile(modelId, file._id)
      if (!res.ok) {
        setDeleteErrorMessage(await getErrorMessage(res))
      } else {
        mutateEntryFiles()
        setDeleteFileOpen(false)
        router.push(`/model/${modelId}?tab=files`)
      }
    }
  }, [file, modelId, router, mutateEntryFiles])

  function handleFileMoreButtonClick(event: MouseEvent<HTMLButtonElement>) {
    setAnchorElMore(event.currentTarget)
  }

  const handleFileMoreButtonClose = () => {
    setAnchorElMore(null)
  }

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
  }, [updateChipDetails, chipDisplay, file])

  const sendNotification = useNotification()
  const { scanners, isScannersLoading, isScannersError } = useGetFileScannerInfo()

  const openMore = Boolean(anchorElMore)
  const openScan = Boolean(anchorElScan)

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
      if (mutator) {
        mutator()
      }
    }
  }, [file, modelId, sendNotification, mutator])

  const rerunFileScanButton = useMemo(() => {
    return (
      <MenuItem hidden={!showMenuItems.rescanFile} onClick={handleRerunFileScanOnClick}>
        <ListItemIcon>
          <Refresh color='primary' fontSize='small' />
        </ListItemIcon>
        <ListItemText>Rerun File Scan</ListItemText>
      </MenuItem>
    )
  }, [handleRerunFileScanOnClick, showMenuItems.rescanFile])

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
    if (!chipDisplay) {
      return <Skeleton variant='text' sx={{ fontSize: '1rem', width: '150px' }} />
    }
    return (
      <>
        {chipDisplay && (
          <Chip
            color={chipDisplay.colour}
            icon={chipDisplay.icon}
            size='small'
            onClick={(e) => setAnchorElScan(e.currentTarget)}
            label={chipDisplay.label}
          />
        )}
        <Popover
          open={openScan}
          anchorEl={anchorElScan}
          onClose={() => setAnchorElScan(null)}
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
  }, [anchorElScan, chipDisplay, file, openScan])

  const handleFileTagSelectorOnChange = async (newTags: string[]) => {
    setFileTagErrorMessage('')
    const res = await patchFile(modelId, file._id, { tags: newTags.filter((newTag) => newTag !== '') })
    mutateEntryFiles()
    if (res.status !== 200) {
      setFileTagErrorMessage('You lack the required authorisation in order to add tags to a file.')
    }
  }

  const handleFileTagOnClick = (fileTag: string) => {
    if (activeFileTagOnChange) {
      if (fileTag === activeFileTag) {
        activeFileTagOnChange('')
      } else {
        activeFileTagOnChange(fileTag)
      }
    }
  }

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
    <Box sx={{ ...style, p: 1 }} key={key}>
      {isFileInterface(file) && (
        <Stack spacing={1}>
          <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} alignItems='center' justifyContent='space-between'>
            <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} alignItems='center'>
              <Tooltip title={file.name}>
                <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
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
              {scanners.length > 0 && (
                <Stack direction='row' spacing={1} alignItems='center'>
                  {avChip}
                </Stack>
              )}
              <Stack>
                <IconButton onClick={handleFileMoreButtonClick}>
                  <MoreVert color='primary' />
                </IconButton>
                <Menu
                  slotProps={{ list: { dense: true } }}
                  anchorEl={anchorElMore}
                  open={openMore}
                  onClose={handleFileMoreButtonClose}
                >
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
                      <ListItemText>Associated Releases</ListItemText>
                    </MenuItem>
                  )}
                  {showMenuItems.deleteFile && (
                    <MenuItem
                      onClick={() => {
                        handleFileMoreButtonClose()
                        setDeleteFileOpen(true)
                      }}
                    >
                      <ListItemIcon>
                        <Delete color='primary' fontSize='small' />
                      </ListItemIcon>
                      <ListItemText>Delete File</ListItemText>
                    </MenuItem>
                  )}
                  {showMenuItems.rescanFile && rerunFileScanButton}
                </Menu>
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
                  {file.tags.map((fileTag) => {
                    if (isClickable) {
                      return (
                        <Chip
                          key={fileTag}
                          label={fileTag}
                          sx={{ width: 'fit-content', m: 0.5 }}
                          onClick={() => handleFileTagOnClick(fileTag)}
                          color={activeFileTag === fileTag ? 'secondary' : undefined}
                        />
                      )
                    } else {
                      return <Chip key={fileTag} label={fileTag} sx={{ width: 'fit-content', m: 0.5 }} />
                    }
                  })}
                </Box>
                <FileTagSelector
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
        file={file}
        latestRelease={latestRelease}
        sortedAssociatedReleases={sortedAssociatedReleases}
      />
      <ConfirmationDialogue
        open={deleteFileOpen}
        title='Delete File'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteFileOpen(false)}
        errorMessage={deleteErrorMessage}
        dialogMessage={
          sortedAssociatedReleases.length > 0
            ? 'Deleting this file will affect the following releases:'
            : 'Deleting this file will not affect any existing releases'
        }
      >
        <Box sx={{ pt: 2 }}>
          <AssociatedReleasesList
            modelId={modelId}
            file={file}
            latestRelease={latestRelease}
            releases={sortedAssociatedReleases}
          />
        </Box>
      </ConfirmationDialogue>
    </Box>
  )
}
