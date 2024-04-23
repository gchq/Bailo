import { TextField } from '@mui/material'
import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'

const htmlId = 'entry-description-input'

type EntryDescriptionInputProps = {
  value: string
  onChange: (value: string) => void
}

export default function EntryDescriptionInput({ value, onChange }: EntryDescriptionInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label='Description' htmlFor={htmlId}>
      <TextField id={htmlId} value={value} size='small' onChange={handleChange} data-test='entryDescriptionInput' />
    </LabelledInput>
  )
}
