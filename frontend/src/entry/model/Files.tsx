import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Box, Button, Card, Container, Menu, Stack } from '@mui/material'
import { useGetModelFiles } from 'actions/model'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import FileDownload from 'src/entry/model/releases/FileDownload'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'

type FilesProps = {
  model: EntryInterface
}

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError } = useGetModelFiles(model.id)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const orderByValue = 'name'

  const sortByGenericValueDescending = (a: FileInterface, b: FileInterface) => {
    return a[orderByValue] < b[orderByValue] ? -1 : 1
  }

  function handleMenuButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuButtonClose = () => {
    setAnchorEl(null)
  }

  const sortedEntryFiles = useMemo(() => [...entryFiles].sort(sortByCreatedAtDescending), [entryFiles])

  const entryFilesList = useMemo(
    () =>
      entryFiles.length ? (
        sortedEntryFiles.sort(sortByGenericValueDescending).map((file) => (
          <Card key={file._id} sx={{ width: '100%' }}>
            <Stack spacing={1} p={2}>
              <FileDownload
                showMenuItems={{ associatedReleases: true, deleteFile: true, rescanFile: true }}
                file={file}
                modelId={model.id}
              />
            </Stack>
          </Card>
        ))
      ) : (
        <EmptyBlob text={`No files found for model ${model.name}`} />
      ),
    [entryFiles.length, model.id, model.name, sortedEntryFiles],
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
        <Stack spacing={2}>
          <Box display='flex'>
            <Box ml='auto'>
              <Button
                endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                data-test='openEntryOverviewActions'
                variant='text'
                onClick={handleMenuButtonClick}
              >
                Order By
              </Button>
              <Menu
                open={menuOpen}
                anchorEl={anchorEl}
                onClick={() => {
                  handleMenuButtonClose()
                }}
              ></Menu>
            </Box>
          </Box>
          <Stack direction={{ xs: 'column' }} spacing={2} justifyContent='center' alignItems='center'>
            {entryFilesList}
          </Stack>
        </Stack>
      </Container>
    </>
  )
}
