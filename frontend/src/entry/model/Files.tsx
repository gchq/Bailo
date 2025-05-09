import { LoadingButton } from '@mui/lab'
import { Box, Button, Card, Container, LinearProgress, Stack, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { postFileForModelId } from 'actions/file'
import { useGetModelFiles } from 'actions/model'
import { AxiosProgressEvent } from 'axios'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import FileUploadProgressDisplay, { FailedFileUpload, FileUploadProgress } from 'src/common/FileUploadProgressDisplay'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import Restricted from 'src/common/Restricted'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

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

  const EntryListItem = ({ data, index }) => (
    <Card key={data[index]._id} sx={{ width: '100%' }}>
      <Stack spacing={1} p={2}>
        <FileDisplay
          showMenuItems={{ associatedReleases: true, deleteFile: true, rescanFile: true }}
          file={data[index]}
          modelId={model.id}
          mutator={mutateEntryFiles}
        />
      </Stack>
    </Card>
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

  if (isEntryFilesError) {
    return <MessageAlert message={isEntryFilesError.info.message} severity='error' />
  }

  if (isEntryFilesLoading) {
    return <Loading />
  }

  return (
    <>
      <Container sx={{ my: 2 }}>
        <Stack direction={{ xs: 'column' }} spacing={2} justifyContent='center' alignItems='center'>
          <Typography>
            Files uploaded to a model can be managed here. For each file you can view associated releases, delete files
            that are no longer needed, and also manually retrigger anti-virus scanning (if anti-virus scanning is
            enabled).
          </Typography>
          <Stack width='100%' direction='row' justifyContent='flex-end' sx={{ px: 0.5 }}>
            <Restricted action='createRelease' fallback={<Button disabled>Add new files</Button>}>
              <>
                <label htmlFor='add-files-button'>
                  <LoadingButton loading={isFilesUploading} fullWidth component='span' variant='outlined'>
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
                totalFilesToUpload={totalFilesToUpload}
              />
            </>
          )}
          {failedFileList}
          <Paginate
            list={entryFiles.map((entryFile) => {
              return { key: entryFile._id, ...entryFile }
            })}
            emptyListText={`No files found for model ${model.name}`}
            sortingProperties={[
              { value: 'name', title: 'Name', iconKind: 'text' },
              { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
              { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
            ]}
            searchPlaceholderText='Search by file name'
          >
            {EntryListItem}
          </Paginate>
        </Stack>
      </Container>
    </>
  )
}
