import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material'
import { useGetModelFiles } from 'actions/model'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import Restricted from 'src/common/Restricted'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import FileUploadDialog from 'src/entry/model/files/FileUploadDialog'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

type FilesProps = {
  model: EntryInterface
}

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError, mutateEntryFiles } = useGetModelFiles(model.id)
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false)
  const [activeFileTag, setActiveFileTag] = useState('')

  const EntryListItem = ({ data, index }) => (
    <Box key={data[index]._id} sx={{ width: '100%' }}>
      <Stack spacing={1} p={2}>
        <FileDisplay
          showMenuItems={{ associatedReleases: true, deleteFile: true, rescanFile: true }}
          file={data[index]}
          modelId={model.id}
          mutator={mutateEntryFiles}
        />
      </Stack>
    </Box>
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
          <Stack
            width='100%'
            direction={{ sm: 'column', md: 'row' }}
            justifyContent='space-between'
            sx={{ py: 0.5, width: '100%' }}
          >
            <Restricted action='createRelease' fallback={<Button disabled>Add new files</Button>}>
              <>
                <Button
                  component='span'
                  variant='outlined'
                  sx={{ float: 'right' }}
                  onClick={() => setIsFileUploadDialogOpen(true)}
                >
                  Add new files
                </Button>
              </>
            </Restricted>
            <FileUploadDialog
              model={model}
              open={isFileUploadDialogOpen}
              onDialogClose={() => setIsFileUploadDialogOpen(false)}
              mutateEntryFiles={mutateEntryFiles}
            />
          </Stack>
          {activeFileTag !== '' && (
            <Stack sx={{ width: '100%' }} direction='row' justifyContent='flex-start' alignItems='center' spacing={1}>
              <Typography>Active filter:</Typography>
              <Chip label={activeFileTag} onDelete={() => setActiveFileTag('')} />
            </Stack>
          )}
          <Paginate
            list={entryFiles.map((entryFile) => {
              return { key: entryFile._id, ...entryFile }
            })}
            emptyListText={`No files found for model ${model.name}`}
            searchFilterProperty='name'
            sortingProperties={[
              { value: 'name', title: 'Name', iconKind: 'text' },
              { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
              { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
            ]}
            searchPlaceholderText='Search by file name'
            defaultSortProperty='name'
          >
            {EntryListItem}
          </Paginate>
        </Stack>
      </Container>
    </>
  )
}
