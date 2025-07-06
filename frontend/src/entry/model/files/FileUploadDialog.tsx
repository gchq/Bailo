import { LoadingButton } from '@mui/lab'
import { Box, Dialog, DialogContent, Divider, LinearProgress, Stack, styled, Typography } from '@mui/material'
import { postFileForModelId } from 'actions/file'
import { AxiosProgressEvent } from 'axios'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import FileUploadProgressDisplay, { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import FileToBeUploaded from 'src/entry/model/files/FileToBeUploaded'
import { EntryInterface, FileUploadMetadata, FileUploadWithMetadata } from 'types/types'

interface FileUploadDialogProps {
  model: EntryInterface
  open: boolean
  onDialogClose: () => void
  mutateEntryFiles: () => void
}

const Input = styled('input')({
  display: 'none',
})

export default function FileUploadDialog({ open, onDialogClose, model, mutateEntryFiles }: FileUploadDialogProps) {
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])
  const [isFilesUploading, setIsFilesUploading] = useState(false)
  const [filesToBeUploaded, setFilesToBeUpload] = useState<FileUploadWithMetadata[]>([])
  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleAddNewFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const newFiles = event.target.files
        ? Array.from(event.target.files).map((newFile) => {
            return { file: newFile }
          })
        : []
      const filteredNewFiles = newFiles.filter(
        (newFile) =>
          filesToBeUploaded.find((existingFile) => existingFile.file.name === newFile.file.name) === undefined,
      )

      setFilesToBeUpload([...filteredNewFiles, ...filesToBeUploaded])
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
        )
        setCurrentFileUploadProgress(undefined)
        if (fileUploadResponse) {
          setUploadedFiles((uploadedFiles) => [...uploadedFiles, fileItem.file.name])
          setFilesToBeUpload(
            filesToBeUploaded.filter((FileToBeUploaded) => FileToBeUploaded.file.name !== fileItem.file.name),
          )
          mutateEntryFiles()
        } else {
          setCurrentFileUploadProgress(undefined)
        }
      } catch (e) {
        if (e instanceof Error) {
          failedFiles.push({ fileName: fileItem.file.name, error: e.message })
          setFailedFileUploads([...failedFileUploads, { fileName: fileItem.file.name, error: e.message }])
          setCurrentFileUploadProgress(undefined)
        }
      }
    }
    setUploadedFiles([])
    setFailedFileUploads(failedFiles)
    setIsFilesUploading(false)
    if (failedFiles.length === 0) {
      onDialogClose()
      setFilesToBeUpload([])
    }
  }, [failedFileUploads, model.id, mutateEntryFiles, filesToBeUploaded, onDialogClose])

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
          <Box component='span' fontWeight='bold'>
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
          <label htmlFor='add-files-button'>
            <LoadingButton loading={isFilesUploading} component='span' variant='outlined' sx={{ width: '100%' }}>
              Select files
            </LoadingButton>
          </label>
          <Input multiple id='add-files-button' type='file' onInput={handleAddNewFiles} data-test='uploadFileButton' />
          {filesToBeUploaded.length > 0 && <Typography fontWeight='bold'>Files to upload</Typography>}
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
            <LoadingButton
              loading={isFilesUploading}
              onClick={handleFileUpload}
              variant='contained'
              color='primary'
              sx={{ maxWidth: 'fit-content', float: 'right' }}
            >
              Upload files
            </LoadingButton>
          </Box>
          {failedFileList}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
