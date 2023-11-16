import { TextField } from '@mui/material'
import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'

const htmlId = 'model-name-input'

type ModelNameInputProps = {
  value: string
  onChange: (value: string) => void
}

export default function ModelNameInput({ value, onChange }: ModelNameInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label='Model' htmlFor={htmlId}>
      <TextField required value={value} size='small' onChange={handleChange} data-test='modelNameInput' />
    </LabelledInput>
  )
}
