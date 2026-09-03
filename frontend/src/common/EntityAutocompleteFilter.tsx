import EntityAutocomplete, { dnToEntity, entityToDn } from 'src/common/EntityAutocomplete'

interface EntityAutocompleteFilterProps {
  label: string
  value?: string
  onChange: (value?: string) => void
}

export default function EntityAutocompleteFilter({ label, value, onChange }: EntityAutocompleteFilterProps) {
  return (
    <EntityAutocomplete
      label={label}
      value={value ? dnToEntity(value) : null}
      onChange={(selected) => onChange(Array.isArray(selected) || !selected ? undefined : entityToDn(selected))}
    />
  )
}
