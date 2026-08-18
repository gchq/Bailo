import EditIcon from '@mui/icons-material/Edit'
import WarningIcon from '@mui/icons-material/Warning'
import { FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { patchEntry } from 'actions/entry'
import { useRouter } from 'next/router'
import { useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type EntrySelectField = Extract<keyof EntryInterface, 'organisation' | 'state'>

type EntrySelectInputProps = {
  label: string
  editable?: boolean
  value?: string
  options: string[]
  entryId: string
  field: EntrySelectField
  mutate: () => void
  showWarningWhenUnset?: boolean
}

export default function EntrySelect({
  label,
  value,
  options,
  entryId,
  field,
  mutate,
  editable = true,
  showWarningWhenUnset = false,
}: EntrySelectInputProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const theme = useTheme()

  const labelLowerCase = label.toLowerCase()

  const handleEditChange = () => {
    setIsEdit(!isEdit)
  }

  const handleSelectOption = async (event: SelectChangeEvent) => {
    setErrorMessage('')
    const response = await patchEntry(entryId, { [field]: event.target.value })
    if (!response.ok) {
      if (field === 'state') {
        router.replace({
          query: { ...router.query, requiredByModelState: event.target.value, isEdit: 'true' },
        })
      }
      setErrorMessage(await getErrorMessage(response))
    } else {
      const { ...queries } = router.query
      delete queries.requiredByModelState
      router.replace({
        query: queries,
      })

      mutate()
      setIsEdit(false)
    }
  }

  return (
    <>
      <Typography id={`${labelLowerCase}-label`} color='primary' sx={{ fontWeight: 'bold' }}>
        {`${label}:`}
      </Typography>
      <Stack direction='row' sx={{ alignItems: 'center' }}>
        {isEdit ? (
          <FormControl sx={{ maxWidth: 240 }} fullWidth size='small'>
            <Select
              onClose={handleEditChange}
              error={Boolean(errorMessage)}
              id={labelLowerCase}
              value={value ?? ''}
              onChange={handleSelectOption}
              displayEmpty
              sx={
                showWarningWhenUnset && !value
                  ? {
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.warning.main },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.warning.dark },
                    }
                  : {}
              }
              renderValue={(value: string) =>
                value ? (
                  value
                ) : (
                  <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
                    <em>Unset</em>
                    {showWarningWhenUnset && (
                      <Tooltip title={`No ${labelLowerCase} has been set`}>
                        <WarningIcon color='warning' fontSize='small' />
                      </Tooltip>
                    )}
                  </Stack>
                )
              }
            >
              {options.map((option: string) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
              <MenuItem value=''>
                <em>Unset</em>
              </MenuItem>
            </Select>
          </FormControl>
        ) : (
          <>
            {value ? (
              <Typography>{value}</Typography>
            ) : (
              <Stack
                direction='row'
                spacing={0.5}
                sx={{
                  alignItems: 'center',
                  ...(showWarningWhenUnset && {
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    borderRadius: 1,
                    px: 0.5,
                  }),
                }}
              >
                <em>Unset</em>
                {showWarningWhenUnset && (
                  <Tooltip title={`No ${labelLowerCase} has been set`}>
                    <WarningIcon color='warning' fontSize='small' />
                  </Tooltip>
                )}
              </Stack>
            )}
            {editable && (
              <IconButton onClick={handleEditChange} aria-label={`Edit ${labelLowerCase}`}>
                <EditIcon fontSize='small' />
              </IconButton>
            )}
          </>
        )}
      </Stack>
      <MessageAlert message={errorMessage} severity='error' />
    </>
  )
}
