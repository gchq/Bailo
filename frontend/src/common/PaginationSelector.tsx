import { ArrowBack, ArrowForward } from '@mui/icons-material'
import { IconButton, Stack, TextField } from '@mui/material'
import { useCallback } from 'react'

interface PaginationSelectorProps {
  currentPage: number | string
  onChange: (newValue: number | string) => void
}

export default function PaginationSelector({ currentPage, onChange }: PaginationSelectorProps) {
  const handleBackPage = useCallback(() => {
    if (currentPage > 1) {
      onChange(parseInt(currentPage as string) - 1)
    }
  }, [currentPage, onChange])

  const handleForwardPage = useCallback(() => {
    onChange(parseInt(currentPage as string) + 1)
  }, [currentPage, onChange])

  const handleManualPageChange = useCallback(
    (newValue: string) => {
      onChange(parseInt(newValue) || '')
    },
    [onChange],
  )

  return (
    <Stack direction='row' sx={{ width: '100%' }} justifyContent='space-between'>
      <IconButton size='small' color='primary' onClick={handleBackPage}>
        <ArrowBack />
      </IconButton>
      <TextField size='small' value={currentPage} onChange={(e) => handleManualPageChange(e.target.value)} />
      <IconButton size='small' color='primary' onClick={handleForwardPage}>
        <ArrowForward />
      </IconButton>
    </Stack>
  )
}
