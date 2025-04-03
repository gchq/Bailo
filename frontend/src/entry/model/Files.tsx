import { LoadingButton } from '@mui/lab'
import { Box, Button, Card, Container, LinearProgress, Stack } from '@mui/material'
import { styled } from '@mui/material/styles'
import { postFileForModelId } from 'actions/file'
import { useGetModelFiles } from 'actions/model'
import { AxiosProgressEvent } from 'axios'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import FileUploadProgressDisplay, { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import FileDownload from 'src/entry/model/releases/FileDownload'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'

type FilesProps = {
  model: EntryInterface
}

const Input = styled('input')({
  display: 'none',
})

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError, mutateEntryFiles } = useGetModelFiles(model.id)

  const [currentFileUploadProgress, setCurrentFileUploadProgress] = useState<FileUploadProgress | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0)
  const [isFilesUploading, setIsFilesUploading] = useState(false)
  const [failedFileUploads, setFailedFileUploads] = useState<FailedFileUpload[]>([])

  const sortedEntryFiles = useMemo(() => [...entryFiles].sort(sortByCreatedAtDescending), [entryFiles])

  const entryFilesList = useMemo(
    () =>
      entryFiles.length ? (
        sortedEntryFiles.map((file) => (
          <Card key={file._id} sx={{ width: '100%' }}>
            <Stack spacing={1} p={2}>
              <FileDownload
                showMenuItems={{ associatedReleases: true, deleteFile: true, rescanFile: true }}
                file={file}
                modelId={model.id}
                mutator={mutateEntryFiles}
              />
            </Stack>
          </Card>
        ))
      ) : (
        <EmptyBlob text={`No files found for model ${model.name}`} />
      ),
    [entryFiles.length, model.id, model.name, sortedEntryFiles, mutateEntryFiles],
  )

  const handleAddNewFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      setIsFilesUploading(true)
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
            setFailedFileUploads([...failedFileUploads, { fileName: file.name, error: e.message }])
            setCurrentFileUploadProgress(undefined)
          }
        }
      }
      setUploadedFiles([])
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

  if (isEntryFilesError) {
    return <MessageAlert message={isEntryFilesError.info.message} severity='error' />
  }

  if (isEntryFilesLoading) {
    return <Loading />
  }

  return (
    <>
      <Container sx={{ my: 2 }}>
        <Stack direction={{ xs: 'column' }} spacing={4}>
          <Box display='flex'>
            <Box ml='auto'>
              <Restricted action='createRelease' fallback={<Button disabled>Add new files</Button>}>
                <>
                  <label htmlFor='add-files-button'>
                    <LoadingButton loading={isFilesUploading} fullWidth component='span' variant='outlined'>
                      Add new files
                    </LoadingButton>
                  </label>
                  <Input
                    multiple
                    id={'add-files-button'}
                    type='file'
                    onInput={handleAddNewFiles}
                    data-test='uploadFileButton'
                  />
                </>
              </Restricted>
            </Box>
          </Box>
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
          {failedFileList}
          {entryFilesList}
        </Stack>
      </Container>
    </>
  )
}
