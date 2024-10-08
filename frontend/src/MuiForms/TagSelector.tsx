import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FormContextType } from '@rjsf/utils'

interface TagSelectorProps {
  onChange: (newValue: string[]) => void
  value: string[]
  label: string
  formContext?: FormContextType
  required?: boolean
  rawErrors?: string[]
}

export default function TagSelector({ onChange, value, label, formContext, required, rawErrors }: TagSelectorProps) {
  const theme = useTheme()

  const handleChange = (_event: React.SyntheticEvent<Element, Event>, newValues: string[]) => {
    onChange([...newValues])
  }

  return (
    <>
      {formContext && formContext.editMode && (
        <>
          <Typography fontWeight='bold'>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            isOptionEqualToValue={(option: string, optionValue: string) => option === optionValue}
            value={value || ''}
            onChange={handleChange}
            options={[]}
            renderTags={(tagValue: string[], getTagProps) =>
              tagValue.map((option: string, index: number) => (
                <Chip variant='outlined' color='primary' label={option} {...getTagProps({ index })} key={option} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                required
                size='small'
                variant='outlined'
                error={rawErrors && rawErrors.length > 0}
                sx={{
                  input: {
                    color: theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
                  },
                  label: {
                    WebkitTextFillColor:
                      theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor:
                      theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
                  },
                  fontStyle: value ? 'unset' : 'italic',
                }}
              />
            )}
          />
        </>
      )}
      {formContext && !formContext.editMode && (
        <>
          <Typography fontWeight='bold'>{label}</Typography>
          {value.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.text.primary,
              }}
            >
              Unanswered
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {value.map((tag) => (
                <Chip label={tag} color='secondary' key={tag} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
