import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { FormContextType } from '@rjsf/utils'
import { KeyboardEvent, SyntheticEvent, useMemo, useState } from 'react'

import { useGetCurrentUser, useListUsers } from '../../actions/user'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface EntitySelectorBetaProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
  formContext?: FormContextType
}

export default function EntitySelectorBeta(props: EntitySelectorBetaProps) {
  const { users, isUsersLoading: isLoading } = useListUsers()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [open, setOpen] = useState(false)

  const theme = useTheme()

  const entities = useMemo(() => {
    if (!users) return []

    return users.map((user) => user.id)
  }, [users])

  const { onChange, value: currentValue, required, label, formContext } = props

  const handleChange = (_event: SyntheticEvent<Element, Event>, newValues: string[]) => {
    onChange(newValues)
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      {currentUser && formContext && formContext.editMode && (
        <Autocomplete
          multiple
          open={open}
          size='small'
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          clearIcon={false}
          // we might get a string or an object back
          isOptionEqualToValue={(option: string, value: string) => option === value}
          getOptionLabel={(option) => option}
          value={currentValue || []}
          onChange={handleChange}
          options={entities || []}
          loading={isLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label + (required ? ' *' : '')}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Backspace') {
                  event.stopPropagation()
                }
              }}
            />
          )}
        />
      )}
      {formContext && !formContext.editMode && (
        <>
          <Typography fontWeight='bold'>{label}</Typography>
          {currentValue.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {currentValue.map((entity) => (
                <Chip label={entity} key={entity} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
