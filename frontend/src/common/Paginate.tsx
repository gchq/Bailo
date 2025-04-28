import { CalendarMonth, Check, ExpandLess, ExpandMore, Sort, SortByAlpha } from '@mui/icons-material'
import { Button, Divider, Grid2, ListItemIcon, ListItemText, Menu, MenuItem, Pagination, Stack } from '@mui/material'
import { isArray } from 'lodash-es'
import { MouseEvent, ReactElement, useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import { FileInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'

interface PaginateProps {
  list: any[]
  pageSize?: number
  emptyListText?: string
  sortingProperties?: SortingProperty[]
  children: ({ data, index }: { data: any; index: any }) => ReactElement
}

export const SortingDirection = {
  ASC: 'Ascending',
  DESC: 'Descending',
} as const

export type SortingDirectionKeys = (typeof SortingDirection)[keyof typeof SortingDirection]

export interface SortingProperty {
  value: string
  title: string
  iconKind: 'text' | 'date'
}

export default function Paginate({
  list,
  pageSize = 10,
  emptyListText = 'No items found',
  children,
  sortingProperties = [{ value: 'name', title: 'Name', iconKind: 'text' }],
}: PaginateProps) {
  const [page, setPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const [orderByValue, setOrderByValue] = useState('createdAt')
  const [orderByButtonTitle, setOrderByButtonTitle] = useState('Order by')
  const [ascOrDesc, setAscOrDesc] = useState<SortingDirectionKeys>(SortingDirection.DESC)

  const pageCount = useMemo(() => (isArray(list) ? Math.ceil(list.length / pageSize) : 10), [list, pageSize])

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

  const displaySortingKindIcon = (sortingKind: SortingProperty['iconKind']) => {
    switch (sortingKind) {
      case 'text':
        return <SortByAlpha color='primary' />
      case 'date':
        return <CalendarMonth color='primary' />
      default:
        ;<SortByAlpha color='primary' />
    }
  }

  const orderByMenuListItems = useCallback(
    (sortingProperty: SortingProperty) => {
      return (
        <MenuItem
          onClick={() => {
            setOrderByValue(sortingProperty.value)
            setOrderByButtonTitle(sortingProperty.title)
          }}
          sx={{ px: 2.5 }}
          selected={checkMenuOption(sortingProperty.value)}
        >
          <Grid2 container sx={{ minWidth: '200px' }}>
            <Grid2 size={2}>
              {checkMenuOption(sortingProperty.value) ? (
                <Check sx={{ width: '100%' }} color='primary' />
              ) : (
                <Check sx={{ width: '100%' }} color='primary' opacity={0} />
              )}
            </Grid2>
            <Grid2 size={2}>
              <ListItemIcon>{displaySortingKindIcon(sortingProperty.iconKind)}</ListItemIcon>
            </Grid2>
            <Grid2 size={8}>
              <ListItemText>{sortingProperty.title}</ListItemText>
            </Grid2>
          </Grid2>
        </MenuItem>
      )
    },
    [checkMenuOption],
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

  const sortingPropertyMenuItems = useMemo(() => {
    return sortingProperties.map((sortingProperty) => {
      return orderByMenuListItems(sortingProperty)
    })
  }, [sortingProperties, orderByMenuListItems])

  const defaultSortedList = useMemo(() => [...list].sort(sortByCreatedAtDescending), [list])

  const listDisplay = useMemo(() => {
    const sortedList = defaultSortedList.sort(sortFilesByValue).slice((page - 1) * pageSize, page * pageSize)
    if (isArray(list)) {
      return sortedList.map((item, index) => (
        <div key={item} style={{ width: '100%' }}>
          {children({ data: sortedList, index })}
        </div>
      ))
    }
  }, [pageSize, page, list, sortFilesByValue, children, defaultSortedList])

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
          {sortingPropertyMenuItems}
          <Divider />
          {ascOrDescMenuListItems(SortingDirection.ASC)}
          {ascOrDescMenuListItems(SortingDirection.DESC)}
        </Menu>
      </Stack>
      {listDisplay}
    </>
  )
}
