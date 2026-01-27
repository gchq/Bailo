import { Add } from '@mui/icons-material'
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material'
import { useGetModelFiles } from 'actions/entry'
import { useGetReleasesForModelId } from 'actions/release'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import Restricted from 'src/common/Restricted'
import FileDisplay from 'src/entry/model/files/FileDisplay'
import FileUploadDialog from 'src/entry/model/files/FileUploadDialog'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKind } from 'types/types'

type FilesProps = {
  model: EntryInterface
}

export default function Files({ model }: FilesProps) {
  const { modelFiles, isModelFilesLoading, isModelFilesError, mutateModelFiles } = useGetModelFiles(model.id)
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false)
  const [activeFileTag, setActiveFileTag] = useState('')

  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

  const EntryListItem = ({ data }) => (
    <Box key={data._id} sx={{ width: '100%' }}>
      <Stack spacing={1} p={2}>
        <FileDisplay
          showMenuItems={{ associatedReleases: true, deleteFile: true, rescanFile: true }}
          file={data}
          modelId={model.id}
          mutator={mutateModelFiles}
          releases={releases}
        />
      </Stack>
    </Box>
  )

  if (isModelFilesError) {
    return <MessageAlert message={isModelFilesError.info.message} severity='error' />
  }

  if (isModelFilesLoading || isReleasesLoading) {
    return <Loading />
  }

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }
  return (
    <>
      <Container sx={{ my: 2 }}>
        <Stack spacing={2} justifyContent='center' alignItems='center'>
          <Typography>
            Files uploaded to a model can be managed here. For each file you can view associated releases, delete files
            that are no longer needed, and also manually retrigger file scanning (if file scanning is enabled).
          </Typography>
          <Stack
            width='100%'
            direction={{ sm: 'column', md: 'row' }}
            justifyContent='flex-end'
            sx={{ py: 0.5, width: '100%', px: 2 }}
          >
            {model.kind !== EntryKind.MIRRORED_MODEL && (
              <Restricted action='createRelease' fallback={<Button disabled>Add new files</Button>}>
                <>
                  <Button
                    component='span'
                    variant='outlined'
                    sx={{ float: 'right' }}
                    onClick={() => setIsFileUploadDialogOpen(true)}
                    startIcon={<Add />}
                  >
                    Add new files
                  </Button>
                </>
              </Restricted>
            )}
            <FileUploadDialog
              model={model}
              open={isFileUploadDialogOpen}
              onDialogClose={() => setIsFileUploadDialogOpen(false)}
              mutateModelFiles={mutateModelFiles}
            />
          </Stack>
          {activeFileTag !== '' && (
            <Stack sx={{ width: '100%' }} direction='row' justifyContent='flex-start' alignItems='center' spacing={1}>
              <Typography>Active filter:</Typography>
              <Chip label={activeFileTag} onDelete={() => setActiveFileTag('')} />
            </Stack>
          )}
          <Paginate
            list={modelFiles.map((entryFile) => {
              return { key: entryFile._id, ...entryFile }
            })}
            emptyListText={`No files found for model ${model.name}`}
            searchFilterProperty='name'
            sortingProperties={[
              { value: 'name', title: 'Name', iconKind: 'text' },
              { value: 'size', title: 'Size', iconKind: 'size' },
              { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
              { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
            ]}
            searchPlaceholderText='Search by file name'
            defaultSortProperty='createdAt'
          >
            {EntryListItem}
          </Paginate>
        </Stack>
      </Container>
    </>
  )
}
