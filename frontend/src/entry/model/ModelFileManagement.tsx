import Add from '@mui/icons-material/Add'
import { Button, Container, Stack, Typography } from '@mui/material'
import { useGetModelFiles } from 'actions/entry'
import { useGetReleasesForModelId } from 'actions/release'
import { useContext, useState } from 'react'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import ArtefactScanningInfoContext from 'src/contexts/artefactScanningInfoContext'
import FileBrowser from 'src/entry/model/files/FileBrowser'
import FileUploadDialog from 'src/entry/model/files/FileUploadDialog'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKind } from 'types/types'

type FilesProps = {
  model: EntryInterface
}

export default function Files({ model }: FilesProps) {
  const scanners = useContext(ArtefactScanningInfoContext)
  const { modelFiles, isModelFilesLoading, isModelFilesError, mutateModelFiles } = useGetModelFiles(model.id)
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false)
  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(model.id)

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
        <Stack
          spacing={2}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography>
            Files uploaded to a model can be managed here. For each file you can view associated releases, delete files
            that are no longer needed
            {scanners.length > 0 && ', and also manually retrigger file scanning (if file scanning is enabled)'}.
          </Typography>
          <Stack
            direction={{ sm: 'column', md: 'row' }}
            sx={{
              width: '100%',
              justifyContent: 'flex-end',
              py: 0.5,
              px: 2,
            }}
          >
            {model.kind !== EntryKind.MIRRORED_MODEL && (
              <Restricted
                action='createRelease'
                overrideTooltip='You do not have permission to upload a file'
                fallback={<Button disabled>Add new files</Button>}
              >
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
          <FileBrowser
            files={modelFiles}
            modelId={model.id}
            modelKind={model.kind}
            releases={releases}
            mutator={mutateModelFiles}
          />
        </Stack>
      </Container>
    </>
  )
}
