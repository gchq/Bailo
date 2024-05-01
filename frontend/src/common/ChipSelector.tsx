import { Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { ReactElement, useState } from 'react'

type PartialChipSelectorProps =
  | {
      multiple: true
      options: string[]
      selectedChips: string[]
      onChange: (value: string[]) => void
    }
  | {
      multiple?: false
      options: string[]
      selectedChips: string
      onChange: (value: string) => void
    }

type ChipSelectorProps = {
  label?: string
  size?: 'small' | 'medium'
  expandThreshold?: number
  chipTooltipTitle?: string
  ariaLabel?: string
} & PartialChipSelectorProps

export default function ChipSelector({
  label,
  options,
  onChange,
  selectedChips,
  multiple,
  size = 'medium',
  expandThreshold = 5,
  chipTooltipTitle = '',
  ariaLabel = '',
}: ChipSelectorProps): ReactElement {
  const [expanded, setExpanded] = useState(false)

  const handleChange = (selectedChip: string): void => {
    if (multiple) {
      if (selectedChips.includes(selectedChip)) {
        onChange(selectedChips.filter((chipFilter) => chipFilter !== selectedChip))
      } else {
        onChange([...selectedChips, selectedChip])
      }
    } else {
      onChange(selectedChips !== selectedChip ? selectedChip : '')
    }
  }

  function toggleExpansion(): void {
    setExpanded(!expanded)
  }

  const allOptions = options.map((option) => (
    <ChipItem
      key={option}
      chip={option}
      size={size}
      activeChip={selectedChips.includes(option)}
      handleChange={handleChange}
      chipTooltipTitle={chipTooltipTitle}
      ariaLabel={ariaLabel}
    />
  ))

  return (
    <>
      {label && <Typography component='h2' variant='h6'>{`${label}`}</Typography>}
      {!expanded && allOptions.slice(0, expandThreshold)}
      {expanded && allOptions}
      {options.length > expandThreshold && (
        <Button onClick={toggleExpansion}>{expanded ? 'Show less' : 'Show more...'}</Button>
      )}
    </>
  )
}

type ChipItemProps = {
  chip: string
  handleChange: (value: string) => void
  size?: ChipSelectorProps['size']
  activeChip: boolean
  chipTooltipTitle?: string
  ariaLabel?: string
}

function ChipItem({ chip, handleChange, size, activeChip, chipTooltipTitle = '', ariaLabel = '' }: ChipItemProps) {
  return (
    <Tooltip title={chipTooltipTitle}>
      <Chip
        color={activeChip ? 'secondary' : 'default'}
        size={size}
        key={chip}
        sx={{ mr: 1, mb: 1 }}
        label={chip}
        data-test={`chipOption-${chip}`}
        onClick={() => handleChange(chip)}
        aria-label={ariaLabel}
      />
    </Tooltip>
  )
}
