import { CalendarMonth, Check, ExpandLess, ExpandMore, Sort, SortByAlpha } from '@mui/icons-material'
import { Box, Button, Card, Container, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { useGetModelFiles } from 'actions/model'
import { MouseEvent, useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import FileDownload from 'src/entry/model/releases/FileDownload'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FileInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'

type FilesProps = {
  model: EntryInterface
}

export const SortingDirection = {
  ASC: 'Ascending',
  DESC: 'Descending',
} as const

export type SortingDirectionKeys = (typeof SortingDirection)[keyof typeof SortingDirection]

export const menuItemDetails = {}

export default function Files({ model }: FilesProps) {
  const { entryFiles, isEntryFilesLoading, isEntryFilesError } = useGetModelFiles(model.id)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const [orderByValue, setOrderByValue] = useState('createdAt')
  const [orderByButtonTitle, setOrderByButtonTitle] = useState('Order by')
  const [ascOrDesc, setAscOrDesc] = useState<SortingDirectionKeys>(SortingDirection.DESC)

  const sortFilesByValue = useMemo(
    () => (a: FileInterface, b: FileInterface) => {
      if (ascOrDesc === SortingDirection.DESC) {
        return a[orderByValue] < b[orderByValue] ? -1 : 1
      }
      return a[orderByValue] > b[orderByValue] ? -1 : 1
    },
    [ascOrDesc, orderByValue],
  )

  const checkMenuOption = useCallback(
    (menuOption: string) => {
      if (menuOption === orderByValue) {
        return true
      } else {
        return false
      }
    },
    [orderByValue],
  )

  function handleMenuButtonClick(event: MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuButtonClose = () => {
    setAnchorEl(null)
  }

  const orderByMenuListItems = (value, title) => (
    <MenuItem
      onClick={() => {
        setOrderByValue(value)
        setOrderByButtonTitle(title)
      }}
      sx={{ paddingX: '8px' }}
      selected={checkMenuOption(value)}
    >
      <Grid2 container sx={{ minWidth: '200px' }}>
        <Grid2 size={2}>
          {checkMenuOption(value) ? (
            <Check sx={{ width: '100%' }} color='primary' />
          ) : (
            <Check sx={{ width: '100%' }} color='primary' opacity={0} />
          )}
        </Grid2>
        <Grid2 size={2}>
          <ListItemIcon>
            {value === 'name' ? <SortByAlpha color='primary' /> : <CalendarMonth color='primary' />}
          </ListItemIcon>
        </Grid2>
        <Grid2 size={8}>
          <ListItemText>{title}</ListItemText>
        </Grid2>
      </Grid2>
    </MenuItem>
  )

  const ascOrDescMenuListItems = (direction) => (
    <MenuItem
      onClick={() => {
        setAscOrDesc(direction)
      }}
      sx={{ paddingX: '8px' }}
      selected={checkAscOrDesc(direction)}
    >
      <Grid2 container sx={{ minWidth: '200px' }}>
        <Grid2 size={2}>
          {checkAscOrDesc(direction) ? (
            <Check sx={{ width: '100%' }} color='primary' />
          ) : (
            <Check sx={{ width: '100%' }} color='primary' opacity={0} />
          )}
        </Grid2>
        <Grid2 size={2}>
          <ListItemIcon>
            {direction === SortingDirection.ASC ? (
              <Sort color='primary' />
            ) : (
              <Sort sx={{ transform: 'scaleY(-1)' }} color='primary' />
            )}
          </ListItemIcon>
        </Grid2>
        <Grid2 size={8}>
          <ListItemText>{direction}</ListItemText>
        </Grid2>
      </Grid2>
    </MenuItem>
  )

  const checkAscOrDesc = (value: string) => {
    return value === ascOrDesc
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
                  onClick={handleMenuButtonClick}
                  endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
                  sx={{ width: '170px' }}
                >
                  <Stack sx={{ minWidth: '150px' }} direction={'row'} spacing={2} justifyContent={'space-evenly'}>
                    {checkAscOrDesc(SortingDirection.ASC) ? (
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
                {orderByMenuListItems('name', 'Name')}
                {orderByMenuListItems('createdAt', 'Date uploaded')}
                {orderByMenuListItems('updatedAt', 'Date updated')}
                <Divider />
                {ascOrDescMenuListItems(SortingDirection.ASC)}
                {ascOrDescMenuListItems(SortingDirection.DESC)}
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
