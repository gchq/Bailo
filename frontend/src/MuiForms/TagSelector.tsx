import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'

export default function TagSelector(props: any) {
  const { onChange, value: currentValue, label, formContext } = props

  const _onChange = (_event: React.SyntheticEvent<Element, Event>, newValues: any) => {
    onChange(newValues.map((value) => value))
  }

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
              sx={
                !formContext.editMode
                  ? { label: { WebkitTextFillColor: 'black' } }
                  : { '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'black' } }
              }
              variant={'outlined'}
              label={label}
              required={!formContext.editMode ? false : true}
            />
          )}
        />
      )}
      {!formContext.editMode && (
        <>
          <Typography sx={{ color: 'black', mb: 1 }}>{label}</Typography>
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
