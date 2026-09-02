import dayjs from '@dayjs'
import { Stack, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'

interface CreatedDateRangeFilterProps {
  createdAfter?: string
  createdBefore?: string
  onCreatedAfterChange: (value?: string) => void
  onCreatedBeforeChange: (value?: string) => void
}

export default function CreatedDateRangeFilter({
  createdAfter,
  createdBefore,
  onCreatedAfterChange,
  onCreatedBeforeChange,
}: CreatedDateRangeFilterProps) {
  const hasError = Boolean(createdAfter && createdBefore && createdAfter > createdBefore)
  const pickerSx = { width: 180 }

  return (
    <Stack spacing={0.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
        <DatePicker
          label='From'
          value={createdAfter ? dayjs(createdAfter) : null}
          onChange={(date) => onCreatedAfterChange(date?.format('YYYY-MM-DD') || undefined)}
          maxDate={createdBefore ? dayjs(createdBefore) : undefined}
          slotProps={{ textField: { size: 'small', error: hasError } }}
          sx={pickerSx}
        />
        <Typography aria-hidden='true'>-</Typography>
        <DatePicker
          label='To'
          value={createdBefore ? dayjs(createdBefore) : null}
          onChange={(date) => onCreatedBeforeChange(date?.format('YYYY-MM-DD') || undefined)}
          minDate={createdAfter ? dayjs(createdAfter) : undefined}
          slotProps={{ textField: { size: 'small', error: hasError } }}
          sx={pickerSx}
        />
      </Stack>
      {hasError && (
        <Typography variant='caption' color='error'>
          The end date must be on or after the start date.
        </Typography>
      )}
    </Stack>
  )
}
