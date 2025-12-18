import { CalendarMonth, Check, ExpandLess, ExpandMore, LineWeight, Sort, SortByAlpha } from '@mui/icons-material'
import {
  Box,
  Button,
  Divider,
  Grid,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Pagination,
  Stack,
  TextField,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { isArray } from 'lodash-es'
import { MouseEvent, ReactElement, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import semver from 'semver'
import EmptyBlob from 'src/common/EmptyBlob'

interface PaginateProps<T> {
  list: Array<T>
  pageSize?: number
  emptyListText?: string
  sortingProperties: SortingProperty<T>[]
  searchFilterProperty: keyof T
  searchPlaceholderText?: string
  hideSearchInput?: boolean
  defaultSortProperty: keyof T
  defaultSortDirection?: SortingDirectionKeys
  hideBorders?: boolean
  hideDividers?: boolean
  children: ({ data }: { data: T }) => ReactElement
}

export const SortingDirection = {
  ASC: 'Ascending',
  DESC: 'Descending',
} as const

export type SortingDirectionKeys = (typeof SortingDirection)[keyof typeof SortingDirection]

export interface SortingProperty<T> {
  value: keyof T
  title: string
  iconKind: 'text' | 'date' | 'size'
}

export default function Paginate<T>({
  list,
  pageSize = 10,
  emptyListText = 'No items found',
  sortingProperties,
  searchFilterProperty,
  searchPlaceholderText = 'Search...',
  hideSearchInput = false,
  defaultSortProperty,
  defaultSortDirection = SortingDirection.DESC,
  hideBorders = false,
  hideDividers = false,
  children,
}: PaginateProps<T>) {
  const [page, setPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const [orderByValue, setOrderByValue] = useState<keyof T>(defaultSortProperty)
  const [orderByButtonTitle, setOrderByButtonTitle] = useState('Order by')
  const [ascOrDesc, setAscOrDesc] = useState<SortingDirectionKeys>(defaultSortDirection)
  const [searchFilter, setSearchFilter] = useState('')
  const [filteredList, setFilteredList] = useState(list)

  const theme = useTheme()

  const onFilteredListUpdated = useEffectEvent((newList: T[]) => {
    setFilteredList(newList)
  })

  useEffect(() => {
    onFilteredListUpdated(
      list.filter((item: T) => {
        if (searchFilterProperty !== undefined && item[searchFilterProperty as string]) {
          return item[searchFilterProperty as string].toLowerCase().includes(searchFilter.toLowerCase())
        }
      }),
    )
  }, [setFilteredList, list, searchFilter, searchFilterProperty])

  const pageCount = useMemo(
    () => (isArray(filteredList) ? Math.ceil(filteredList.length / pageSize) : 10),
    [filteredList, pageSize],
  )

  const handlePageOnChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  const sortByValue = useMemo(
    () => (a: T, b: T) => {
      if (ascOrDesc === SortingDirection.ASC) {
        return a[orderByValue] < b[orderByValue] ? -1 : 1
      }
      return a[orderByValue] > b[orderByValue] ? -1 : 1
    },
    [ascOrDesc, orderByValue],
  )

  const checkMenuOption = useCallback(
    (menuOption: string) => {
      return menuOption === orderByValue
    },
    [orderByValue],
  )

  function handleMenuButtonClick(event: MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuButtonClose = () => {
    setAnchorEl(null)
  }

  const displaySortingKindIcon = useCallback((sortingKind: SortingProperty<T>['iconKind']) => {
    switch (sortingKind) {
      case 'text':
        return <SortByAlpha color='primary' />
      case 'date':
        return <CalendarMonth color='primary' />
      case 'size':
        return <LineWeight color='primary' />
      default:
        return <SortByAlpha color='primary' />
    }
  }, [])

  const compareSemanticVersions = useCallback(
    (a: T, b: T) => {
      if (typeof a[orderByValue] !== 'string' || typeof b[orderByValue] !== 'string') {
        return 1
      }
      if (ascOrDesc === SortingDirection.ASC) {
        return semver.gt(a[orderByValue], b[orderByValue]) ? 1 : -1
      } else {
        return semver.gt(b[orderByValue], a[orderByValue]) ? 1 : -1
      }
    },
    [ascOrDesc, orderByValue],
  )

  const orderByMenuListItems = useCallback(
    (sortingProperty: SortingProperty<T>) => {
      return (
        <MenuItem
          onClick={() => {
            setOrderByValue(sortingProperty.value)
            setOrderByButtonTitle(sortingProperty.title)
          }}
          sx={{ px: 2.5 }}
          selected={checkMenuOption(sortingProperty.value.toString())}
        >
          <Grid container sx={{ minWidth: '200px' }}>
            <Grid size={2}>
              {checkMenuOption(sortingProperty.value.toString()) ? (
                <Check sx={{ width: '100%' }} color='primary' />
              ) : (
                <Check sx={{ width: '100%' }} color='primary' opacity={0} />
              )}
            </Grid>
            <Grid size={2}>
              <ListItemIcon>{displaySortingKindIcon(sortingProperty.iconKind)}</ListItemIcon>
            </Grid>
            <Grid size={8}>
              <ListItemText>{sortingProperty.title}</ListItemText>
            </Grid>
          </Grid>
        </MenuItem>
      )
    },
    [checkMenuOption, displaySortingKindIcon],
  )

  const ascOrDescMenuListItems = (direction: SortingDirectionKeys) => (
    <MenuItem
      onClick={() => {
        setAscOrDesc(direction)
      }}
      sx={{ px: 2.5 }}
      selected={checkAscOrDesc(direction)}
    >
      <Grid container sx={{ minWidth: '200px' }}>
        <Grid size={2}>
          {checkAscOrDesc(direction) ? (
            <Check sx={{ width: '100%' }} color='primary' />
          ) : (
            <Check sx={{ width: '100%' }} color='primary' opacity={0} />
          )}
        </Grid>
        <Grid size={2}>
          <ListItemIcon>
            {direction === SortingDirection.DESC ? (
              <Sort color='primary' />
            ) : (
              <Sort sx={{ transform: 'scaleY(-1)' }} color='primary' />
            )}
          </ListItemIcon>
        </Grid>
        <Grid size={8}>
          <ListItemText>{direction}</ListItemText>
        </Grid>
      </Grid>
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

  const listDisplay = useMemo(() => {
    let sortedList
    if (orderByValue === 'semver') {
      sortedList = filteredList.sort(compareSemanticVersions)
      sortedList = sortedList.slice((page - 1) * pageSize, page * pageSize)
    } else {
      sortedList = filteredList.sort(sortByValue)
      sortedList = sortedList.slice((page - 1) * pageSize, page * pageSize)
    }
    if (isArray(sortedList)) {
      return sortedList.map((item, index) => (
        <div key={item['key']} style={{ width: '100%' }}>
          {children({ data: sortedList[index] })}
        </div>
      ))
    }
  }, [orderByValue, filteredList, compareSemanticVersions, sortByValue, page, pageSize, children])

  if (list.length === 0) {
    return <EmptyBlob text={emptyListText} />
  }

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ pt: 1, pb: 2, width: '100%', px: 2 }}
        spacing={1}
        justifyContent='space-between'
        alignItems='center'
      >
        {!hideSearchInput && (
          <TextField
            size='small'
            value={searchFilter}
            label={searchPlaceholderText}
            onChange={(e) => setSearchFilter(e.target.value)}
            sx={{ maxWidth: '200px' }}
          />
        )}
        {hideSearchInput && <div style={{ maxWidth: '200px', width: '100%' }}></div>}
        <Button
          onClick={handleMenuButtonClick}
          endIcon={anchorEl ? <ExpandLess /> : <ExpandMore />}
          sx={{ maxWidth: '200px' }}
          fullWidth
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
      <Box sx={{ px: 2, width: '100%' }}>
        <Stack
          sx={{
            border: hideBorders ? 'none' : 'solid',
            borderWidth: '0.5px',
            width: '100%',
            margin: 'auto',
            borderColor: theme.palette.divider,
            borderRadius: 1,
          }}
          divider={hideDividers ? <></> : <Divider flexItem />}
        >
          {listDisplay}
        </Stack>
      </Box>
      <Stack sx={{ width: '100%', pt: 3, pb: 1 }} alignItems='center'>
        <Pagination
          count={pageCount}
          page={page}
          onChange={handlePageOnChange}
          aria-label='bottom page pagination navigation'
        />
      </Stack>
    </>
  )
}
