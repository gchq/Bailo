import { TextField } from '@mui/material'
import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'

const htmlId = 'entry-source-modelid-input'

type EntrySourceModelInputProps = {
  value: string
  onChange: (value: string) => void
}

export default function SourceModelInput({ value, onChange }: EntrySourceModelInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label='Source ModelId' htmlFor={htmlId}>
      <TextField
        id={htmlId}
        value={value}
        size='small'
        onChange={handleChange}
        data-test='entrySourceModelInput'
      ></TextField>
    </LabelledInput>
  )
}
