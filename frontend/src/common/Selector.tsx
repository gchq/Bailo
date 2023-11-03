import { Autocomplete, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { SyntheticEvent, useMemo } from 'react'

interface SelectorProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  disabled?: boolean
  loading?: boolean
}

export default function Selector({
  label,
  value,
  options,
  onChange,
  disabled = false,
  loading = false,
}: SelectorProps) {
  const theme = useTheme()

  const handleChange = (_event: SyntheticEvent, newValue: string | null) => {
    onChange(newValue ? newValue : '')
  }

  const htmlId = useMemo(() => `${label.toLocaleLowerCase}-input`, [label])

  return (
    <Stack width='100%'>
      <Typography component='label' sx={{ fontWeight: 'bold' }} htmlFor={htmlId}>
        {label} <span style={{ color: theme.palette.primary.main }}>*</span>
      </Typography>
      <Autocomplete
        freeSolo
        autoSelect
        id={htmlId}
        loading={loading}
        value={value}
        options={options}
        disabled={disabled}
        renderInput={(params) => <TextField {...params} required size='small' />}
        onChange={handleChange}
        data-test={`${label.toLocaleLowerCase()}Selector`}
      />
    </Stack>
  )
}
