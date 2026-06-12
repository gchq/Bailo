import EditIcon from '@mui/icons-material/Edit'
import { IconButton, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
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
}

export default function EntrySelect({
  label,
  value,
  options,
  entryId,
  field,
  mutate,
  editable = true,
}: EntrySelectInputProps) {
  const [isEdit, setIsEdit] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const theme = useTheme()
  const router = useRouter()

  const handleEditChange = () => {
    setIsEdit(!isEdit)
  }

  const handleSelectOption = async (event: SelectChangeEvent) => {
    setErrorMessage('')
    const response = await patchEntry(entryId, { [field]: event.target.value })
    if (!response.ok) {
      if (field === 'state') {
        router.replace({
          query: { ...router.query, requiredState: event.target.value },
        })
      }
      setErrorMessage(await getErrorMessage(response))
    } else {
      if (field === 'state') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { requiredState, ...queryWithoutFiltered } = router.query
        router.replace({
          query: queryWithoutFiltered,
        })
      }
      mutate()
    }
    setIsEdit(false)
  }

  return (
    <>
      <Typography id={`${label.toLowerCase()}-label`} sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
        {`${label}:`}
      </Typography>
      {isEdit ? (
        <Stack direction='row' alignItems='center'>
          <Select
            label={label}
            size='small'
            error={Boolean(errorMessage)}
            id={label.toLowerCase()}
            value={value ?? ''}
            onChange={handleSelectOption}
          >
            {options.map((option: string) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value=''>Unset</MenuItem>
          </Select>
        </Stack>
      ) : (
        <Stack direction='row' alignItems='center'>
          <Typography>{value ? value : 'Unset'}</Typography>
          {editable && (
            <IconButton onClick={handleEditChange} aria-label={`Edit ${label.toLowerCase()}`}>
              <EditIcon fontSize='small' />
            </IconButton>
          )}
        </Stack>
      )}
      <MessageAlert message={errorMessage} severity='error' />
    </>
  )
}
