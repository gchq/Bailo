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
        <Autocomplete
          multiple
          isOptionEqualToValue={(option: any, value: any) => option === value}
          getOptionLabel={(option) => option.label}
          value={currentValue || null}
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
              }}
              variant='outlined'
              label={label}
              required={!formContext.editMode ? false : true}
            />
          )}
        />
      )}
      {!formContext.editMode && (
        <>
          <Typography sx={{ color: theme.palette.mode === 'light' ? 'black' : 'white', mb: 1 }}>{label}</Typography>
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
