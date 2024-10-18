import { ArrowBack, ArrowForward } from '@mui/icons-material'
import { IconButton, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { useCallback, useMemo } from 'react'

interface PaginationSelectorProps {
  currentPage: number | string
  onChange: (newValue: number | string) => void
  totalEntries: number
}

export default function PaginationSelector({ currentPage, onChange, totalEntries }: PaginationSelectorProps) {
  const lastPage = useMemo(() => {
    return totalEntries / 10
  }, [totalEntries])

  const handleBackPage = useCallback(() => {
    if (currentPage > 1) {
      onChange(parseInt(currentPage as string) - 1)
    }
  }, [currentPage, onChange])

  const handleForwardPage = useCallback(() => {
    if (currentPage < lastPage - 1) {
      onChange(parseInt(currentPage as string) + 1)
    }
  }, [currentPage, lastPage, onChange])

  const handleManualPageChange = useCallback(
    (event: SelectChangeEvent) => {
      onChange(parseInt(event.target.value) || '')
    },
    [onChange],
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
      <IconButton size='small' color='primary' onClick={handleForwardPage}>
        <ArrowForward />
      </IconButton>
    </Stack>
  )
}
