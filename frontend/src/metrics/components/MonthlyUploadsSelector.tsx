import dayjs, { Dayjs } from '@dayjs'
import { Stack, Typography } from '@mui/material'
import { alpha, SxProps, Theme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'

const minimumDate = '1970/01/01'

interface MonthlyUploadsSelectorProps {
  startDate: Dayjs | null
  endDate: Dayjs | null
  showTitle?: boolean
  condensed?: boolean
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
  const datePickerSx: SxProps<Theme> = {
    width: 185,
    '& .MuiPickersOutlinedInput-root': {
      height: 40,
    },
    '& .MuiPickersSectionList-root': {
      padding: '4px 0',
    },
    '& .MuiPickersInputBase-sectionContent': {
      fontSize: '0.875rem',
      color: 'primary.main',
    },
    '& .MuiPickersOutlinedInput-notchedOutline': {
      borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.5),
    },
    '&:hover .MuiPickersOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
    '& .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
      borderWidth: 2,
    },
    '& .MuiIconButton-root': {
      color: 'primary.main',
    },
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ sm: 'column', md: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
        {showTitle && (
          <Typography sx={{ fontWeight: 'bold', paddingRight: 1 }} variant='h6' color='primary'>
            Monthly uploads between
          </Typography>
        )}
        <DatePicker
          openTo='month'
          views={['year', 'month']}
          value={startDate}
          onChange={onStartDateChange}
          minDate={dayjs(minimumDate)}
          maxDate={endDate || dayjs()}
          slotProps={{ textField: { size: 'small' } }}
          sx={datePickerSx}
        />
        <Typography sx={{ fontWeight: 'bold' }} variant='h6' color='primary'>
          -
        </Typography>
        <DatePicker
          openTo='month'
          views={['year', 'month']}
          value={endDate}
          onChange={onEndDateChange}
          minDate={startDate || dayjs(minimumDate)}
          maxDate={dayjs()}
          sx={datePickerSx}
        />
      </Stack>
      {!!errorMessage && <Typography color='error'>{errorMessage}</Typography>}
    </Stack>
  )
}
