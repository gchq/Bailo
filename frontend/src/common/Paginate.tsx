import { CalendarMonth, Check, ExpandLess, ExpandMore, Sort, SortByAlpha } from '@mui/icons-material'
import { Button, Divider, Grid2, ListItemIcon, ListItemText, Menu, MenuItem, Pagination, Stack } from '@mui/material'
import { isArray } from 'lodash-es'
import { ReactElement, useCallback, useMemo, useState, MouseEvent, ReactNode, Children } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import { SortingDirection } from 'src/entry/model/Files'
import { FileInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'

interface PaginateProps {
  list: any[]
  pageSize?: number
  emptyListText?: string
  children: ({ data, index }: { data: any; index: any }) => ReactElement
}

export type SortingDirectionKeys = (typeof SortingDirection)[keyof typeof SortingDirection]

export default function Paginate({ list, pageSize = 10, emptyListText = 'No items found', children }: PaginateProps) {
  const [page, setPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const [orderByValue, setOrderByValue] = useState('createdAt')
  const [orderByButtonTitle, setOrderByButtonTitle] = useState('Order by')
  const [ascOrDesc, setAscOrDesc] = useState<SortingDirectionKeys>(SortingDirection.DESC)
  const pageCount = useMemo(() => (isArray(list) ? Math.ceil(list.length / pageSize) : 10), [list])

  const handlePageOnChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

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

  const orderByMenuListItems = (value: string, title: string) => (
    <MenuItem
      onClick={() => {
        setOrderByValue(value)
        setOrderByButtonTitle(title)
      }}
      sx={{ px: 2.5 }}
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

  const ascOrDescMenuListItems = (direction: SortingDirectionKeys) => (
    <MenuItem
      onClick={() => {
        setAscOrDesc(direction)
      }}
      sx={{ px: 2.5 }}
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

  const sortedList = useMemo(() => [...list].sort(sortByCreatedAtDescending), [list])

  // TODO

  // Make it so that this list is sorted and sliced based on the UI ordering
  // Remove the sorting code from Files.tsx

  const listDisplay = useMemo(() => {
    console.log(children({ data: list, index: 0 }))
    if (isArray(list)) {
      return sortedList
        .sort(sortFilesByValue)
        .slice((page - 1) * pageSize, page * pageSize)
        .map((_item, index) => <div>{children({ data: list, index })}</div>)
    }
  }, [pageSize, page, list, sortFilesByValue])

  if (list.length === 0) {
    return <EmptyBlob text={emptyListText} />
  }

  return (
    <>
      <Stack direction='row'>
        <Pagination count={pageCount} page={page} onChange={handlePageOnChange} />
        <Button
          onClick={handleMenuButtonClick}
          endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
          sx={{ width: '170px' }}
        >
          <Stack sx={{ minWidth: '150px' }} direction='row' spacing={2} justifyContent='space-evenly'>
            {checkAscOrDesc(SortingDirection.ASC) ? (
              <Sort color='primary' />
            ) : (
              <Sort sx={{ transform: 'scaleY(-1)' }} color='primary' />
            )}
            {orderByButtonTitle}
          </Stack>
        </Button>
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
      </Stack>
      {listDisplay}
    </>
  )
}
