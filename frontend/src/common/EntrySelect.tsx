import EditIcon from '@mui/icons-material/Edit'
import WarningIcon from '@mui/icons-material/Warning'
import { FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Tooltip, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { patchEntry } from 'actions/entry'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
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
  // Holds the user's choice until the server confirms it, so the field does not flash back to the old value
  const [pendingValue, setPendingValue] = useState<string | undefined>(undefined)
  const router = useRouter()
  const theme = useTheme()

  const labelLowerCase = label.toLowerCase()
  const displayValue = pendingValue ?? value

  useEffect(() => {
    if (pendingValue !== undefined && value === pendingValue) {
      setPendingValue(undefined)
    }
  }, [value, pendingValue])

  const handleEditChange = () => {
    setIsEdit((previous) => !previous)
  }

  const handleSelectOption = async (event: SelectChangeEvent) => {
    const selectedValue = event.target.value
    setErrorMessage('')
    setPendingValue(selectedValue)
    const response = await patchEntry(entryId, { [field]: selectedValue })
    if (!response.ok) {
      // The change was rejected, so show the stored value again alongside the error
      setPendingValue(undefined)
      setIsEdit(true)
      if (field === 'state') {
        router.replace({
          query: { ...router.query, requiredByModelState: selectedValue, isEdit: 'true' },
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
              value={displayValue ?? ''}
              onChange={handleSelectOption}
              displayEmpty
              renderValue={(value: string) =>
                value ? (
                  value
                ) : (
                  <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
                    <em>Unset</em>
                    {showWarningWhenUnset && (
                      <Tooltip title={`No ${labelLowerCase} has been set`}>
                        <WarningIcon role='alert' color='warning' fontSize='small' />
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
            {displayValue ? (
              <Typography>{displayValue}</Typography>
            ) : showWarningWhenUnset ? (
              <Tooltip title={`No ${labelLowerCase} has been set`}>
                <Stack
                  direction='row'
                  spacing={0.5}
                  sx={{
                    alignItems: 'center',
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    borderRadius: 1,
                    px: 0.5,
                  }}
                >
                  <em>Unset</em>
                  <WarningIcon role='alert' color='warning' fontSize='small' />
                </Stack>
              </Tooltip>
            ) : (
              <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
                <em>Unset</em>
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
