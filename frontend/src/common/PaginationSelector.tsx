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
import { useCallback, useEffect, useMemo } from 'react'

interface PaginationSelectorProps {
  currentPage: number
  onCurrentPageChange: (newValue: number) => void
  totalEntries: number
  pageSize: number
  onPageSizeChange: (newValue: number) => void
}

export default function PaginationSelector({
  currentPage,
  onCurrentPageChange,
  totalEntries,
  pageSize,
  onPageSizeChange,
}: PaginationSelectorProps) {
  const lastPage = useMemo(() => {
    return Math.ceil(totalEntries / parseInt(pageSize.toString()))
  }, [pageSize, totalEntries])

  useEffect(() => {
    if (currentPage > lastPage) {
      onCurrentPageChange(lastPage)
    }
  }, [currentPage, lastPage, onCurrentPageChange])

  const handleBackPage = useCallback(() => {
    if (currentPage > 1) {
      onCurrentPageChange(currentPage - 1)
    }
  }, [currentPage, onCurrentPageChange])

  const handleForwardPage = useCallback(() => {
    if (currentPage < lastPage) {
      onCurrentPageChange(currentPage + 1)
    }
  }, [currentPage, lastPage, onCurrentPageChange])

  const handleManualPageChange = useCallback(
    (event: SelectChangeEvent) => {
      onCurrentPageChange(parseInt(event.target.value))
    },
    [onCurrentPageChange],
  )

  const handlePageSizeChange = useCallback(
    (event: SelectChangeEvent) => {
      onPageSizeChange(parseInt(event.target.value))
    },
    [onPageSizeChange],
  )

  const pageNumberOptions = useMemo(() => {
    return [...Array(lastPage | 0)].map((_, index) => {
      return (
        <MenuItem key={index} value={index + 1}>
          {index + 1}
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
        value={`${currentPage}`}
        label='Page'
        onChange={handleManualPageChange}
        MenuProps={{
          sx: {
            maxHeight: 400,
          },
        }}
      >
        {pageNumberOptions}
      </Select>
      <Typography>of {Math.round(lastPage)}</Typography>
      <FormControl sx={{ m: 1, minWidth: 100 }}>
        <InputLabel id='page-size-selector'>Page size</InputLabel>
        <Select
          labelId='page-size-selector'
          label='Page size'
          size='small'
          value={`${pageSize}`}
          onChange={handlePageSizeChange}
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
