import { Card, Container, Stack, Typography } from '@mui/material'
import { useGetModelFiles } from 'actions/model'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import FileDownload from 'src/entry/model/releases/FileDownload'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'

type FilesProps = {
  model: EntryInterface
}

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError, mutateEntryFiles } = useGetModelFiles(model.id)

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
          {entryFilesList}
        </Stack>
      </Container>
    </>
  )
}
