import dayjs, { Dayjs } from '@dayjs'
import { Stack, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'

interface MonthlyUploadsSelectorProps {
  startDate: Dayjs | null
  endDate: Dayjs | null
  showTitle?: boolean
  errorMessage?: string
  onStartDateChange: (date: Dayjs | null) => void
  onEndDateChange: (date: Dayjs | null) => void
}

export function MonthlyUploadsSelector({
  startDate,
  endDate,
  showTitle = true,
  errorMessage,
  onStartDateChange,
  onEndDateChange,
}: MonthlyUploadsSelectorProps) {
  return (
    <Stack spacing={2}>
      <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
        {showTitle && (
          <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
            Monthly uploads between
          </Typography>
        )}
        <DatePicker
          openTo='month'
          views={['year', 'month']}
          value={startDate}
          onChange={onStartDateChange}
          minDate={dayjs('1970/01/01')}
          maxDate={endDate || dayjs()}
        />
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          -
        </Typography>
        <DatePicker
          openTo='month'
          views={['year', 'month']}
          value={endDate}
          onChange={onEndDateChange}
          minDate={startDate || dayjs('1970/01/01')}
          maxDate={dayjs()}
        />
      </Stack>
      {!!errorMessage && <Typography color='error'>{errorMessage}</Typography>}
    </Stack>
  )
}
