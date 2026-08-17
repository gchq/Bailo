import styled from '@emotion/styled'
import Close from '@mui/icons-material/Close'
import UploadFile from '@mui/icons-material/UploadFile'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { postFileForModelId } from 'actions/file'
import { AxiosProgressEvent } from 'axios'
import { ChangeEvent, DragEvent, useCallback, useContext, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import FileUploadProgressDisplay, { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import { Transition } from 'src/common/Transition'
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
  const theme = useTheme()
  const uiConfig = useContext(UiConfigContext)
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])
  const [isFilesUploading, setIsFilesUploading] = useState(false)
  const [filesToBeUploaded, setFilesToBeUpload] = useState<FileUploadWithMetadata[]>([])
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const addNewFiles = useCallback(
    (newFileList: FileList | null) => {
      const newFiles = newFileList ? Array.from(newFileList).map((newFile) => ({ file: newFile })) : []
      const filteredNewFiles = newFiles.filter(
        (newFile) =>
          filesToBeUploaded.find((existingFile) => existingFile.file.name === newFile.file.name) === undefined,
      )

      setFilesToBeUpload([...filteredNewFiles, ...filesToBeUploaded])
    },
    [filesToBeUploaded],
  )

  const handleAddNewFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      addNewFiles(event.target.files)
      // Clear the input so that re-selecting a previously removed file triggers onChange again
      event.target.value = ''
    },
    [addNewFiles],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingOver(true)
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingOver(false)
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDraggingOver(false)
      addNewFiles(event.dataTransfer.files)
    },
    [addNewFiles],
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

  const handleDialogClose = useCallback(() => {
    if (!isFilesUploading) {
      onDialogClose()
    }
  }, [isFilesUploading, onDialogClose])

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
    <Dialog open={open} onClose={handleDialogClose} maxWidth='md' fullWidth slots={{ transition: Transition }}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Upload Files
        <IconButton aria-label='close upload files dialog' onClick={handleDialogClose} disabled={isFilesUploading}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <label htmlFor='add-files-button' style={{ width: '100%' }}>
            <Box
              component='span'
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                py: 3,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderRadius: 1,
                borderColor: isDraggingOver ? theme.palette.primary.main : theme.palette.divider,
                backgroundColor: isDraggingOver ? theme.palette.action.hover : 'transparent',
                cursor: 'pointer',
              }}
            >
              <Stack spacing={1} sx={{ alignItems: 'center' }}>
                <UploadFile color='primary' fontSize='large' />
                <Typography>
                  Drag &amp; drop files here or{' '}
                  <Box component='span' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    click to browse
                  </Box>
                </Typography>
              </Stack>
            </Box>
          </label>
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
          <Stack spacing={1.5}>{fileListToUpload}</Stack>
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
      <DialogActions sx={{ p: 2 }}>
        <Button variant='outlined' onClick={handleDialogClose} disabled={isFilesUploading}>
          Cancel
        </Button>
        <Button
          disabled={filesToBeUploaded.length === 0}
          loading={isFilesUploading}
          onClick={handleFileUpload}
          variant='contained'
          color='primary'
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  )
}
