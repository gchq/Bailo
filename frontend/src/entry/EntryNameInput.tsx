import { TextField, Tooltip } from '@mui/material'
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

export default function EntryNameInput({
  value,
  kind,
  onChange,
  autoFocus = false,
  isReadOnly = false,
  requiredRolesText = '',
}: EntryNameInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <LabelledInput required label={`${toTitleCase(kind)} Name`} htmlFor={htmlId}>
      <Tooltip title={requiredRolesText}>
        <span>
          <TextField
            required
            fullWidth
            disabled={isReadOnly}
            autoFocus={autoFocus}
            value={value}
            size='small'
            id={htmlId}
            onChange={handleChange}
            data-test='entryNameInput'
          />
        </span>
      </Tooltip>
    </LabelledInput>
  )
}
