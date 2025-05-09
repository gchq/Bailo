import { CalendarMonth, Check, ExpandLess, ExpandMore, Sort, SortByAlpha } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { styled } from '@mui/material/styles'
import { postFileForModelId } from 'actions/file'
import { useGetModelFiles } from 'actions/model'
import { AxiosProgressEvent } from 'axios'
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import FileUploadProgressDisplay, { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import FileDownload from 'src/entry/model/releases/FileDownload'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'

type FilesProps = {
  model: EntryInterface
}

export const SortingDirection = {
  ASC: 'Ascending',
  DESC: 'Descending',
} as const

export type SortingDirectionKeys = (typeof SortingDirection)[keyof typeof SortingDirection]

export const menuItemDetails = {}

const Input = styled('input')({
  display: 'none',
})

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError, mutateEntryFiles } = useGetModelFiles(model.id)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const [orderByValue, setOrderByValue] = useState('createdAt')
  const [orderByButtonTitle, setOrderByButtonTitle] = useState('Order by')
  const [ascOrDesc, setAscOrDesc] = useState<SortingDirectionKeys>(SortingDirection.DESC)
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0)
  const [isFilesUploading, setIsFilesUploading] = useState(false)
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])
  const [hideTags, setHideTags] = useState(false)
  const [activeFileTag, setActiveFileTag] = useState('')

  const sortFilesByValue = useMemo(
    () => (a: FileInterface, b: FileInterface) => {
      if (ascOrDesc === SortingDirection.DESC) {
        return a[orderByValue] < b[orderByValue] ? -1 : 1
      }
      return a[orderByValue] > b[orderByValue] ? -1 : 1
    },
    [ascOrDesc, orderByValue],
  )

  const checkMenuOption = useCallback(
    (menuOption: string) => {
      if (menuOption === orderByValue) {
        return true
      } else {
        return false
      }
    },
    [orderByValue],
  )

  function handleMenuButtonClick(event: MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuButtonClose = () => {
    setAnchorEl(null)
  }

  const orderByMenuListItems = (value, title) => (
    <MenuItem
      onClick={() => {
        setOrderByValue(value)
        setOrderByButtonTitle(title)
      }}
      sx={{ px: 2.5 }}
      selected={checkMenuOption(value)}
    >
      <Grid2 container sx={{ minWidth: '200px' }}>
        <Grid2 size={2}>
          {checkMenuOption(value) ? (
            <Check sx={{ width: '100%' }} color='primary' />
          ) : (
            <Check sx={{ width: '100%' }} color='primary' opacity={0} />
          )}
        </Grid2>
        <Grid2 size={2}>
          <ListItemIcon>
            {value === 'name' ? <SortByAlpha color='primary' /> : <CalendarMonth color='primary' />}
          </ListItemIcon>
        </Grid2>
        <Grid2 size={8}>
          <ListItemText>{title}</ListItemText>
        </Grid2>
      </Grid2>
    </MenuItem>
  )

  const ascOrDescMenuListItems = (direction) => (
    <MenuItem
      onClick={() => {
        setAscOrDesc(direction)
      }}
      sx={{ px: 2.5 }}
      selected={checkAscOrDesc(direction)}
    >
      <Grid2 container sx={{ minWidth: '200px' }}>
        <Grid2 size={2}>
          {checkAscOrDesc(direction) ? (
            <Check sx={{ width: '100%' }} color='primary' />
          ) : (
            <Check sx={{ width: '100%' }} color='primary' opacity={0} />
          )}
        </Grid2>
        <Grid2 size={2}>
          <ListItemIcon>
            {direction === SortingDirection.ASC ? (
              <Sort color='primary' />
            ) : (
              <Sort sx={{ transform: 'scaleY(-1)' }} color='primary' />
            )}
          </ListItemIcon>
        </Grid2>
        <Grid2 size={8}>
          <ListItemText>{direction}</ListItemText>
        </Grid2>
      </Grid2>
    </MenuItem>
  )

  const checkAscOrDesc = (value: string) => {
    return value === ascOrDesc
  }

  const sortedEntryFiles = useMemo(() => [...entryFiles].sort(sortByCreatedAtDescending), [entryFiles])

  const entryFilesList = useMemo(
    () =>
      entryFiles.length ? (
        sortedEntryFiles
          .sort(sortFilesByValue)
          .filter((filteredFile) => (activeFileTag !== '' ? filteredFile.tags.includes(activeFileTag) : filteredFile))
          .map((file) => (
            <Card key={file._id} sx={{ width: '100%' }}>
              <Stack spacing={1} p={2}>
                <FileDownload
                  showMenuItems={{ associatedReleases: true, deleteFile: true, rescanFile: true }}
                  file={file}
                  modelId={model.id}
                  mutator={mutateEntryFiles}
                  hideTags={hideTags}
                  isClickable
                  activeFileTag={activeFileTag}
                  activeFileTagOnChange={(newTag) => setActiveFileTag(newTag)}
                />
              </Stack>
            </Card>
          ))
      ) : (
        <EmptyBlob text={`No files found for model ${model.name}`} />
      ),
    [
      entryFiles.length,
      sortedEntryFiles,
      sortFilesByValue,
      model.name,
      model.id,
      mutateEntryFiles,
      hideTags,
      activeFileTag,
    ],
  )

  const handleAddNewFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      setIsFilesUploading(true)
      setFailedFileUploads([])
      const failedFiles: FailedFileUpload[] = []
      const files = event.target.files ? Array.from(event.target.files) : []
      setTotalFilesToUpload(files.length)
      for (const file of files) {
        const handleUploadProgress = (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setCurrentFileUploadProgress({ fileName: file.name, uploadProgress: percentCompleted })
          }
        }

        try {
          const fileUploadResponse = await postFileForModelId(model.id, file, handleUploadProgress, '')
          setCurrentFileUploadProgress(undefined)
          if (fileUploadResponse) {
            setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name])
            mutateEntryFiles()
          } else {
            setCurrentFileUploadProgress(undefined)
          }
        } catch (e) {
          if (e instanceof Error) {
            failedFiles.push({ fileName: file.name, error: e.message })
            setFailedFileUploads([...failedFileUploads, { fileName: file.name, error: e.message }])
            setCurrentFileUploadProgress(undefined)
          }
        }
      }
      setUploadedFiles([])
      setFailedFileUploads(failedFiles)
      setTotalFilesToUpload(0)
      setIsFilesUploading(false)
    },
    [model.id, mutateEntryFiles, failedFileUploads],
  )

  const failedFileList = useMemo(
    () =>
      failedFileUploads.map((file) => (
        <div key={file.fileName}>
          <Box component='span' fontWeight='bold'>
            {file.fileName}
          </Box>
          {` - ${file.error}`}
        </div>
      )),
    [failedFileUploads],
  )

  const handleHideTagsOnChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setHideTags(event.target.checked)
      if (event.target.checked) {
        setActiveFileTag('')
      }
    },
    [setActiveFileTag, setHideTags],
  )

  if (isEntryFilesError) {
    return <MessageAlert message={isEntryFilesError.info.message} severity='error' />
  }

  if (isEntryFilesLoading) {
    return <Loading />
  }

  return (
    <>
      <Container sx={{ my: 2 }}>
        <Stack spacing={2} justifyContent='center' alignItems='center'>
          <Typography>
            Files uploaded to a model can be managed here. For each file you can view associated releases, delete files
            that are no longer needed, and also manually retrigger anti-virus scanning (if anti-virus scanning is
            enabled).
          </Typography>
          <Stack width='100%' direction={{ sm: 'column', md: 'row' }} justifyContent='space-between' sx={{ px: 0.5 }}>
            <Restricted action='createRelease' fallback={<Button disabled>Add new files</Button>}>
              <>
                <label htmlFor='add-files-button'>
                  <LoadingButton loading={isFilesUploading} component='span' variant='outlined' sx={{ float: 'right' }}>
                    Add new files
                  </LoadingButton>
                </label>
                <Input
                  multiple
                  id='add-files-button'
                  type='file'
                  onInput={handleAddNewFiles}
                  data-test='uploadFileButton'
                />
              </>
            </Restricted>
            <div>
              <FormControl>
                <FormControlLabel
                  control={<Checkbox checked={hideTags} onChange={(e) => handleHideTagsOnChange(e)} />}
                  label='Hide tags'
                />
              </FormControl>
              <Button
                onClick={handleMenuButtonClick}
                endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                sx={{ width: '170px' }}
              >
                <Stack sx={{ minWidth: '150px' }} direction='row' spacing={2} justifyContent='space-evenly'>
                  {checkAscOrDesc(SortingDirection.ASC) ? (
                    <Sort color='primary' />
                  ) : (
                    <Sort sx={{ transform: 'scaleY(-1)' }} color='primary' />
                  )}
                  {orderByButtonTitle}
                </Stack>
              </Button>
            </div>
          </Stack>
          <Menu
            open={menuOpen}
            slotProps={{ list: { dense: true } }}
            anchorEl={anchorEl}
            onClose={handleMenuButtonClose}
            sx={{ minWidth: '200px' }}
          >
            {orderByMenuListItems('name', 'Name')}
            {orderByMenuListItems('createdAt', 'Date uploaded')}
            {orderByMenuListItems('updatedAt', 'Date updated')}
            <Divider />
            {ascOrDescMenuListItems(SortingDirection.ASC)}
            {ascOrDescMenuListItems(SortingDirection.DESC)}
          </Menu>
          {currentFileUploadProgress && (
            <>
              <LinearProgress
                variant={currentFileUploadProgress.uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                value={currentFileUploadProgress.uploadProgress}
              />
              <FileUploadProgressDisplay
                currentFileUploadProgress={currentFileUploadProgress}
                uploadedFiles={uploadedFiles.length}
                totalFilesToUpload={totalFilesToUpload}
              />
            </>
          )}
          {activeFileTag !== '' && (
            <Stack sx={{ width: '100%' }} direction='row' justifyContent='flex-start' alignItems='center' spacing={1}>
              <Typography>Active filter:</Typography>
              <Chip label={activeFileTag} onDelete={() => setActiveFileTag('')} />
            </Stack>
          )}
          {failedFileList}
          {entryFilesList}
        </Stack>
      </Container>
    </>
  )
}
