import { TextField } from '@mui/material'
import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import { EntryKindKeys } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

const htmlId = 'entry-name-input'

type EntryNameInputProps = {
  value: string
  kind: EntryKindKeys
  onChange: (value: string) => void
  autoFocus?: boolean
}

export default function EntryNameInput({ value, kind, onChange, autoFocus = false }: EntryNameInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label={`${toTitleCase(kind)} Name`} htmlFor={htmlId}>
      <TextField
        required
        autoFocus={autoFocus}
        value={value}
        size='small'
        id={htmlId}
        onChange={handleChange}
        data-test='entryNameInput'
      />
    </LabelledInput>
  )
}
