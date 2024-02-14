import { TextField } from '@mui/material'
import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'

const htmlId = 'model-description-input'

type ModelDescriptionInputProps = {
  value: string
  onChange: (value: string) => void
}

export default function ModelDescriptionInput({ value, onChange }: ModelDescriptionInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label='Description' htmlFor={htmlId}>
      <TextField id={htmlId} value={value} size='small' onChange={handleChange} data-test='modelDescriptionInput' />
    </LabelledInput>
  )
}
