import { Card, Container, Stack } from '@mui/material'
import { useGetModelFiles } from 'actions/model'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import FileDownload from 'src/entry/model/releases/FileDownload'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface } from 'types/types'

type FilesProps = {
  model: EntryInterface
}

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError } = useGetModelFiles(model.id)

  const sortEntryFiles: Array<FileInterface> = useMemo(
    () =>
      entryFiles.sort((a, b) => {
        if (a.createdAt > b.createdAt) {
          return -1
        }
        if (a.createdAt < b.createdAt) {
          return 1
        } else {
          return 0
        }
      }),
    [entryFiles],
  )

  const entryFilesList = useMemo(
    () =>
      entryFiles.length ? (
        sortEntryFiles.map((file) => (
          <Card key={file._id} sx={{ width: '100%' }}>
            <Stack spacing={1} p={2}>
              <FileDownload key={file.name} file={file} modelId={model.id} hideAssociatedReleases={false} />
            </Stack>
          </Card>
        ))
      ) : (
        <EmptyBlob text={`No files found for model ${model.name}`} />
      ),
    [entryFiles.length, model.id, model.name, sortEntryFiles],
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
          {entryFilesList}
        </Stack>
      </Container>
    </>
  )
}
