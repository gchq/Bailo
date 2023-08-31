import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

export default function TagSelector(props: any) {
  const { onChange, value: currentValue, label, formContext } = props

  const _onChange = (_event: React.SyntheticEvent<Element, Event>, newValues: any) => {
    onChange(newValues.map((value) => value))
  }

  const theme = useTheme()

  return (
    <>
      {formContext.editMode && (
        <>
          <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
          <Autocomplete
            multiple
            isOptionEqualToValue={(option: any, value: any) => option === value}
            value={currentValue || ''}
            onChange={_onChange}
            options={[]}
            freeSolo
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                // eslint-disable-next-line react/jsx-key
                <Chip variant='outlined' label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                size='small'
                sx={{
                  input: {
                    color: theme.palette.mode === 'light' ? 'black' : 'white',
                  },
                  label: {
                    WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
                  },
                  fontStyle: currentValue ? 'unset' : 'italic',
                }}
                variant='outlined'
                required={!formContext.editMode ? false : true}
              />
            )}
          />
        </>
      )}
      {!formContext.editMode && (
        <>
          <Typography sx={{ fontWeight: 'bold' }}>{label}</Typography>
          {currentValue.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.mode === 'light' ? '#535353' : '#c8c8c8',
              }}
            >
              Unanswered
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {currentValue.map((tag) => (
                <Chip label={tag} key={tag} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
