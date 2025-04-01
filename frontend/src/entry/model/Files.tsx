import { Abc, ArrowDownward, ArrowUpward, CalendarMonth, ExpandLess, ExpandMore } from '@mui/icons-material'
import { Box, Button, Card, Container, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
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
  const [orderByValue, setOrderByValue] = useState('createdAt')
  const [orderByButtonTitle, setOrderByButtonTitle] = useState('Order by')
  const [ASCorDESC, setASCorDESC] = useState('DESC')

  const sortFilesByValue = useMemo(
    () => (a: FileInterface, b: FileInterface) => {
      if (ASCorDESC === 'DESC') {
        return a[orderByValue] > b[orderByValue] ? -1 : 1
      }
      return a[orderByValue] < b[orderByValue] ? -1 : 1
    },
    [ASCorDESC, orderByValue],
  )

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
        sortedEntryFiles.sort(sortFilesByValue).map((file) => (
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
    [entryFiles.length, model.id, model.name, sortFilesByValue, sortedEntryFiles],
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
              <Stack direction={'row'} divider={<Divider orientation='vertical' />}>
                <Button
                  sx={{ minWidth: '160px' }}
                  variant='text'
                  onClick={handleMenuButtonClick}
                  endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                >
                  {orderByButtonTitle}
                </Button>
                <Button
                  sx={{ padding: 0.5, minWidth: '72px' }}
                  variant='outlined'
                  onClick={() => setASCorDESC(ASCorDESC === 'DESC' ? 'ASC' : 'DESC')}
                >
                  {ASCorDESC === 'ASC' ? <ArrowUpward /> : <ArrowDownward />}
                  {ASCorDESC}
                </Button>
              </Stack>
              <Menu
                open={menuOpen}
                slotProps={{ list: { dense: true } }}
                anchorEl={anchorEl}
                onClose={handleMenuButtonClose}
              >
                <MenuItem
                  onClick={() => {
                    setOrderByValue('name')
                    setOrderByButtonTitle('Alphabetical')
                  }}
                >
                  <ListItemIcon>
                    <Abc color='primary' />
                  </ListItemIcon>
                  <ListItemText>Alphabetical</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOrderByValue('createdAt')
                    setOrderByButtonTitle('Date uploaded')
                  }}
                >
                  <ListItemIcon>
                    <CalendarMonth color='primary' />
                  </ListItemIcon>
                  <ListItemText>Date uploaded</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOrderByValue('updatedAt')
                    setOrderByButtonTitle('Date updated')
                  }}
                >
                  <ListItemIcon>
                    <CalendarMonth color='primary' />
                  </ListItemIcon>
                  <ListItemText>Date updated</ListItemText>
                </MenuItem>
              </Menu>
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
