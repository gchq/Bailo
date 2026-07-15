import styled from '@emotion/styled'
import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import FileUpload from '@mui/icons-material/FileUpload'
import FolderOpen from '@mui/icons-material/FolderOpen'
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  ClickAwayListener,
  Dialog,
  DialogContent,
  Divider,
  Grow,
  LinearProgress,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material'
import { postFileForModelId } from 'actions/file'
import { AxiosProgressEvent } from 'axios'
import { ChangeEvent, useCallback, useContext, useMemo, useRef, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import FileUploadProgressDisplay, { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import UiConfigContext from 'src/contexts/uiConfigContext'
import FileToBeUploaded from 'src/entry/model/files/FileToBeUploaded'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKind, FileUploadMetadata, FileUploadWithMetadata } from 'types/types'
import { plural } from 'utils/stringUtils'

interface FileUploadDialogProps {
  model: EntryInterface
  open: boolean
  onDialogClose: () => void
  mutateModelFiles: () => void
}

const Input = styled('input')({
  display: 'none',
})

export default function FileUploadDialog({ open, onDialogClose, model, mutateModelFiles }: FileUploadDialogProps) {
  const uiConfig = useContext(UiConfigContext)
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])
  const [isFilesUploading, setIsFilesUploading] = useState(false)
  const [filesToBeUploaded, setFilesToBeUpload] = useState<FileUploadWithMetadata[]>([])
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [splitMenuAnchor, setSplitMenuAnchor] = useState<HTMLElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const handleAddNewFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const newFiles = event.target.files
        ? Array.from(event.target.files).map((newFile) => {
            // For folder uploads, webkitRelativePath contains the path relative to the selected folder
            const uploadPath = newFile.webkitRelativePath || undefined
            const dedupeKey = uploadPath || newFile.name
            return { file: newFile, uploadPath, _dedupeKey: dedupeKey }
          })
        : []
      const filteredNewFiles = newFiles.filter(
        (newFile) =>
          filesToBeUploaded.find(
            (existingFile) => (existingFile.uploadPath || existingFile.file.name) === newFile._dedupeKey,
          ) === undefined,
      )

      setFilesToBeUpload([...filteredNewFiles.map(({ _dedupeKey: _, ...rest }) => rest), ...filesToBeUploaded])
      // Reset input value so re-selecting the same folder works
      event.target.value = ''
    },
    [filesToBeUploaded],
  )

  const handleFileMetadataOnChange = useCallback(
    (metadata: FileUploadMetadata, fileName: string) => {
      setFilesToBeUpload(
        filesToBeUploaded.map((fileWithMetadata) =>
          fileWithMetadata.file.name === fileName
            ? {
                ...fileWithMetadata,
                metadata: {
                  text: metadata.text,
                  tags: metadata.tags,
                },
              }
            : fileWithMetadata,
        ),
      )
    },
    [filesToBeUploaded, setFilesToBeUpload],
  )

  const handleFileUpload = useCallback(async () => {
    const failedFiles: FailedFileUpload[] = []
    setIsFilesUploading(true)
    setFailedFileUploads([])
    for (const fileItem of filesToBeUploaded) {
      const handleUploadProgress = (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setCurrentFileUploadProgress({ fileName: fileItem.file.name, uploadProgress: percentCompleted })
        }
      }

      try {
        const fileUploadResponse = await postFileForModelId(
          model.id,
          fileItem.file,
          handleUploadProgress,
          fileItem.metadata,
          fileItem.uploadPath,
        )
        setCurrentFileUploadProgress(undefined)
        if (fileUploadResponse) {
          setUploadedFiles((uploadedFiles) => [...uploadedFiles, fileItem.file.name])
          setFilesToBeUpload(
            filesToBeUploaded.filter((FileToBeUploaded) => FileToBeUploaded.file.name !== fileItem.file.name),
          )
          mutateModelFiles()
        } else {
          setCurrentFileUploadProgress(undefined)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown upload error'
        const failed = { fileName: fileItem.file.name, error: message }
        failedFiles.push(failed)

        setFailedFileUploads((prev) => [...prev, failed])
        setCurrentFileUploadProgress(undefined)
      }
    }
    setUploadedFiles([])
    setFailedFileUploads(failedFiles)
    setIsFilesUploading(false)
    if (failedFiles.length === 0) {
      onDialogClose()
      setFilesToBeUpload([])
    }
  }, [model.id, mutateModelFiles, filesToBeUploaded, onDialogClose])

  const handleDeleteFileFromUploadList = useCallback(
    (fileName: string) => {
      setFilesToBeUpload(filesToBeUploaded.filter((file) => file.file.name !== fileName))
    },
    [filesToBeUploaded],
  )

  const fileListToUpload = useMemo(() => {
    return filesToBeUploaded.map((fileWithMetadata) => (
      <FileToBeUploaded
        key={fileWithMetadata.file.name}
        fileWithMetadata={fileWithMetadata}
        onFileMetadataChange={handleFileMetadataOnChange}
        onDelete={handleDeleteFileFromUploadList}
      />
    ))
  }, [filesToBeUploaded, handleFileMetadataOnChange, handleDeleteFileFromUploadList])

  const failedFileList = useMemo(
    () =>
      failedFileUploads.map((file) => (
        <div key={file.fileName}>
          <Box
            component='span'
            sx={{
              fontWeight: 'bold',
            }}
          >
            {file.fileName}
          </Box>
          {` - ${file.error}`}
        </div>
      )),
    [failedFileUploads],
  )

  return (
    <Dialog open={open} onClose={onDialogClose} maxWidth='md' fullWidth>
      <DialogContent>
        <Stack spacing={2}>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ButtonGroup variant='outlined'>
              <label htmlFor='add-files-button'>
                <Button loading={isFilesUploading} endIcon={<FileUpload />} component='span'>
                  Select files
                </Button>
              </label>
              <Button
                size='small'
                onClick={(e) => setSplitMenuAnchor(splitMenuAnchor ? null : e.currentTarget)}
                aria-label='Select upload type'
              >
                <ArrowDropDown />
              </Button>
            </ButtonGroup>
            <Popper
              open={Boolean(splitMenuAnchor)}
              anchorEl={splitMenuAnchor}
              transition
              disablePortal
              sx={{ zIndex: 1 }}
            >
              {({ TransitionProps }) => (
                <Grow {...TransitionProps}>
                  <Paper>
                    <ClickAwayListener onClickAway={() => setSplitMenuAnchor(null)}>
                      <MenuList>
                        <MenuItem
                          onClick={() => {
                            setSplitMenuAnchor(null)
                            folderInputRef.current?.click()
                          }}
                        >
                          <FolderOpen sx={{ mr: 1 }} fontSize='small' />
                          Select folder
                        </MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Box>
          {model.kind === EntryKind.UNTRUSTED_MODEL && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <MessageAlert
                message={uiConfig.untrustedModel.fileUploadGuidance}
                severity='warning'
                style={{ width: 'fit-content' }}
              />
            </Box>
          )}
          <Input multiple id='add-files-button' type='file' onChange={handleAddNewFiles} data-test='uploadFileButton' />
          {/* @ts-expect-error webkitdirectory is a non-standard attribute for folder selection */}
          <input
            ref={folderInputRef}
            type='file'
            style={{ display: 'none' }}
            onChange={handleAddNewFiles}
            data-test='uploadFolderButton'
            webkitdirectory=''
            directory=''
          />
          {filesToBeUploaded.length === 0 && <EmptyBlob text='No files selected.' />}
          {filesToBeUploaded.length > 0 && (
            <Typography
              sx={{
                fontWeight: 'bold',
              }}
            >
              Files to upload
            </Typography>
          )}
          <Stack divider={<Divider />} spacing={1}>
            {fileListToUpload}
          </Stack>
          {currentFileUploadProgress && (
            <>
              <LinearProgress
                variant={currentFileUploadProgress.uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                value={currentFileUploadProgress.uploadProgress}
              />
              <FileUploadProgressDisplay
                currentFileUploadProgress={currentFileUploadProgress}
                uploadedFiles={uploadedFiles.length}
                totalFilesToUpload={filesToBeUploaded.length}
              />
            </>
          )}
          <Box sx={{ width: '100%' }}>
            <Button
              disabled={filesToBeUploaded.length === 0}
              loading={isFilesUploading}
              onClick={handleFileUpload}
              variant='contained'
              color='primary'
              sx={{ maxWidth: 'fit-content', float: 'right' }}
            >
              Upload files
            </Button>
          </Box>
          {failedFileUploads.length > 0 && (
            <Alert severity='error' sx={{ my: 2 }}>
              <Stack spacing={1}>
                <Typography>{`Unable to upload the following ${plural(failedFileUploads.length, 'file')}:`}</Typography>
                {failedFileList}
              </Stack>
            </Alert>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
