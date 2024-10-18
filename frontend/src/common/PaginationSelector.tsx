import { ArrowBack, ArrowForward } from '@mui/icons-material'
import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material'
import { useCallback, useMemo } from 'react'

interface PaginationSelectorProps {
  currentPage: number | string
  currentPageOnChange: (newValue: number | string) => void
  totalEntries: number
  pageSize: number | string
  pageSizeOnChange: (newValue: number | string) => void
}

export default function PaginationSelector({
  currentPage,
  currentPageOnChange,
  totalEntries,
  pageSize,
  pageSizeOnChange,
}: PaginationSelectorProps) {
  const lastPage = useMemo(() => {
    return Math.ceil(totalEntries / parseInt(pageSize as string))
  }, [pageSize, totalEntries])

  const handleBackPage = useCallback(() => {
    if (currentPage > 1) {
      currentPageOnChange(parseInt(currentPage as string) - 1)
    }
  }, [currentPage, currentPageOnChange])

  const handleForwardPage = useCallback(() => {
    if (currentPage < lastPage) {
      currentPageOnChange(parseInt(currentPage as string) + 1)
    }
  }, [currentPage, lastPage, currentPageOnChange])

  const handleManualPageChange = useCallback(
    (event: SelectChangeEvent) => {
      currentPageOnChange(parseInt(event.target.value) || '')
    },
    [currentPageOnChange],
  )

  const menuItems = useMemo(() => {
    return [...Array(lastPage | 0)].map((_, i) => {
      return (
        <MenuItem key={i} value={i + 1}>
          {i + 1}
        </MenuItem>
      )
    })
  }, [lastPage])

  return (
    <Stack spacing={2} direction='row' sx={{ width: '100%', p: 2 }} justifyContent='center' alignItems='center'>
      <IconButton size='small' color='primary' onClick={handleBackPage}>
        <ArrowBack />
      </IconButton>
      <Typography>Page:</Typography>
      <Select
        size='small'
        value={currentPage.toString()}
        label='Age'
        onChange={handleManualPageChange}
        MenuProps={{
          style: {
            maxHeight: 400,
          },
        }}
      >
        {menuItems}
      </Select>
      <Typography>of {Math.round(lastPage)}</Typography>
      <FormControl sx={{ m: 1, minWidth: 100 }}>
        <InputLabel id='page-size-selector'>Page size</InputLabel>
        <Select
          labelId='page-size-selector'
          label='Page size'
          size='small'
          value={pageSize}
          onChange={(event) => pageSizeOnChange(event.target.value)}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
      </FormControl>
      <IconButton size='small' color='primary' onClick={handleForwardPage}>
        <ArrowForward />
      </IconButton>
    </Stack>
  )
}
