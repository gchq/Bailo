import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import LimitedTextField from 'src/common/LimitedTextField'
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
    <LabelledInput fullWidth required label={`${toTitleCase(kind)} Name`} htmlFor={htmlId}>
      <LimitedTextField
        required
        fullWidth
        autoFocus={autoFocus}
        value={value}
        size='small'
        id={htmlId}
        onChange={handleChange}
        slotProps={{
          htmlInput: { 'data-test': 'entryNameInput' },
        }}
      />
    </LabelledInput>
  )
}
