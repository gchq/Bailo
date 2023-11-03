import Selector from 'src/common/Selector'

const modelNames = []

export type ModelSelectorProps = {
  value: string
  onChange: (value: string) => void
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return <Selector label='Model' value={value} options={modelNames} onChange={onChange} />
}
