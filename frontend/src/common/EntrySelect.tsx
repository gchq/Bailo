import EditIcon from '@mui/icons-material/Edit'
import { FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
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
  const router = useRouter()

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
          query: { ...router.query, requiredByModelState: event.target.value },
        })
      }
      setErrorMessage(await getErrorMessage(response))
      setIsEdit(true)
    } else {
      if (field === 'state') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { requiredByModelState, ...queryWithoutFiltered } = router.query
        router.replace({
          query: queryWithoutFiltered,
        })
      }
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
              renderValue={(value: string) => (value ? value : <em>Unset</em>)}
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
            {value ? <Typography>{value}</Typography> : <em>Unset</em>}
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
