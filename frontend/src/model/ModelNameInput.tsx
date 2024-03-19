import { TextField } from '@mui/material'
import { ChangeEvent, HTMLProps } from 'react'
import LabelledInput from 'src/common/LabelledInput'

const htmlId = 'model-name-input'

type ModelNameInputProps = {
  value: string
  onChange: (value: string) => void
  inputProps?: HTMLProps<HTMLInputElement>
}

export default function ModelNameInput({ value, onChange, inputProps }: ModelNameInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label='Model' htmlFor={htmlId}>
      <TextField
        inputProps={inputProps}
        required
        value={value}
        size='small'
        onChange={handleChange}
        data-test='modelNameInput'
      />
    </LabelledInput>
  )
}
