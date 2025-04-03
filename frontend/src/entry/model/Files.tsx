import { CalendarMonth, Check, ExpandLess, ExpandMore, Sort, SortByAlpha } from '@mui/icons-material'
import { Box, Button, Card, Container, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { useGetModelFiles } from 'actions/model'
import { useCallback, useMemo, useState } from 'react'
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
        return a[orderByValue] < b[orderByValue] ? -1 : 1
      }
      return a[orderByValue] > b[orderByValue] ? -1 : 1
    },
    [ASCorDESC, orderByValue],
  )

  const checkMenuOption = useCallback(
    (menuOption: string) => {
      if (menuOption === orderByValue) {
        return <Check sx={{ width: '100%' }} color='primary' />
      } else {
        return <Check sx={{ width: '100%' }} color='primary' opacity={0} />
      }
    },
    [orderByValue],
  )

  const selectedMenuOption = useCallback(
    (menuOption: string) => {
      if (menuOption === orderByValue) {
        return true
      } else {
        return false
      }
    },
    [orderByValue],
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
              <Stack direction={'row'}>
                <Button
                  variant='text'
                  onClick={handleMenuButtonClick}
                  endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                >
                  <Stack sx={{ minWidth: '150px' }} direction={'row'} spacing={2} justifyContent={'space-evenly'}>
                    {ASCorDESC === 'ASC' ? (
                      <Sort color='primary' />
                    ) : (
                      <Sort sx={{ transform: 'scaleY(-1)' }} color='primary' />
                    )}
                    {orderByButtonTitle}
                  </Stack>
                </Button>
              </Stack>
              <Menu
                open={menuOpen}
                slotProps={{ list: { dense: true } }}
                anchorEl={anchorEl}
                onClose={handleMenuButtonClose}
                sx={{ minWidth: '200px' }}
              >
                <MenuItem
                  onClick={() => {
                    setOrderByValue('name')
                    setOrderByButtonTitle('Alphabetical')
                  }}
                  sx={{ paddingX: '8px' }}
                  selected={selectedMenuOption('name')}
                >
                  <Grid2 container sx={{ minWidth: '200px' }}>
                    <Grid2 size={3}>{checkMenuOption('name')}</Grid2>
                    <Grid2 size={3}>
                      <ListItemIcon>
                        <SortByAlpha color='primary' />
                      </ListItemIcon>
                    </Grid2>
                    <Grid2 size={6}>
                      <ListItemText>Alphabetical</ListItemText>
                    </Grid2>
                  </Grid2>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOrderByValue('createdAt')
                    setOrderByButtonTitle('Date Uploaded')
                  }}
                  sx={{ paddingX: '8px' }}
                  selected={selectedMenuOption('createdAt')}
                >
                  <Grid2 container sx={{ minWidth: '200px' }}>
                    <Grid2 size={3}>{checkMenuOption('createdAt')}</Grid2>
                    <Grid2 size={3}>
                      <ListItemIcon>
                        <CalendarMonth color='primary' />
                      </ListItemIcon>
                    </Grid2>
                    <Grid2 size={6}>
                      <ListItemText>Date uploaded</ListItemText>
                    </Grid2>
                  </Grid2>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOrderByValue('updatedAt')
                    setOrderByButtonTitle('Date updated')
                  }}
                  sx={{ paddingX: '8px' }}
                  selected={selectedMenuOption('updatedAt')}
                >
                  <Grid2 container sx={{ minWidth: '200px' }}>
                    <Grid2 size={3}>{checkMenuOption('updatedAt')}</Grid2>
                    <Grid2 size={3}>
                      <ListItemIcon>
                        <CalendarMonth color='primary' />
                      </ListItemIcon>
                    </Grid2>
                    <Grid2 size={6}>
                      <ListItemText>Date updated</ListItemText>
                    </Grid2>
                  </Grid2>
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setASCorDESC('ASC')
                  }}
                  sx={{ paddingX: '8px' }}
                  selected={ASCorDESC === 'ASC'}
                >
                  <Grid2 container sx={{ minWidth: '200px' }}>
                    <Grid2 size={3}>
                      {ASCorDESC === 'ASC' ? (
                        <Check sx={{ width: '100%' }} color='primary' />
                      ) : (
                        <Check sx={{ width: '100%' }} color='primary' opacity={0} />
                      )}
                    </Grid2>
                    <Grid2 size={3}>
                      <ListItemIcon>
                        <Sort color='primary' />
                      </ListItemIcon>
                    </Grid2>
                    <Grid2 size={6}>
                      <ListItemText>Ascending</ListItemText>
                    </Grid2>
                  </Grid2>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setASCorDESC('DESC')
                  }}
                  sx={{ paddingX: '8px' }}
                  selected={ASCorDESC === 'DESC'}
                >
                  <Grid2 container sx={{ minWidth: '200px' }}>
                    <Grid2 size={3}>
                      {ASCorDESC === 'DESC' ? (
                        <Check sx={{ width: '100%' }} color='primary' />
                      ) : (
                        <Check sx={{ width: '100%' }} color='primary' opacity={0} />
                      )}
                    </Grid2>
                    <Grid2 size={3}>
                      <ListItemIcon>
                        <Sort sx={{ transform: 'scaleY(-1)' }} color='primary' />
                      </ListItemIcon>
                    </Grid2>
                    <Grid2 size={6}>
                      <ListItemText>Descending</ListItemText>
                    </Grid2>
                  </Grid2>
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
