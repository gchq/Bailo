import { TextField, Tooltip } from '@mui/material'
import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'

const htmlId = 'entry-description-input'

type EntryDescriptionInputProps = {
  value: string
  onChange: (value: string) => void
} & (
  | {
      isReadOnly: boolean
      requiredRolesText: string
    }
  | {
      isReadOnly?: never
      requiredRolesText?: never
    }
)

export default function EntryDescriptionInput({
  value,
  onChange,
  isReadOnly = false,
  requiredRolesText = '',
}: EntryDescriptionInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label='Description' htmlFor={htmlId}>
      <Tooltip title={requiredRolesText}>
        <span>
          <TextField
            fullWidth
            id={htmlId}
            value={value}
            size='small'
            disabled={isReadOnly}
            onChange={handleChange}
            data-test='entryDescriptionInput'
          />
        </span>
      </Tooltip>
    </LabelledInput>
  )
}
