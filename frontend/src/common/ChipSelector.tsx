import { ExpandMore } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Stack, Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { CSSProperties, ReactElement, useState } from 'react'

type PartialChipSelectorProps =
  | {
      multiple: true
      options: string[]
      unreachableOptions?: string[]
      selectedChips: string[]
      onChange: (value: string[]) => void
    }
  | {
      multiple?: false
      options: string[]
      unreachableOptions?: string[]
      selectedChips: string
      onChange: (value: string) => void
    }

type ChipSelectorProps = {
  label?: string
  subheading?: string
  size?: 'small' | 'medium'
  expandThreshold?: number
  chipTooltipTitle?: string
  ariaLabel?: string
  accordion?: boolean
  variant?: 'filled' | 'outlined'
  icon?: ReactElement
  style?: CSSProperties
} & PartialChipSelectorProps

export default function ChipSelector({
  label,
  subheading,
  options,
  unreachableOptions,
  onChange,
  selectedChips,
  multiple,
  size = 'medium',
  expandThreshold = 5,
  chipTooltipTitle = '',
  ariaLabel = '',
  accordion = false,
  variant = 'filled',
  icon = <></>,
  style = {},
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
      key={option.toString()}
      chip={option}
      size={size}
      activeChip={selectedChips.includes(option)}
      handleChange={handleChange}
      chipTooltipTitle={
        unreachableOptions && !unreachableOptions.includes(option) ? chipTooltipTitle : 'This is unreachable.'
      }
      ariaLabel={ariaLabel}
      variant={variant}
      icon={icon}
      style={style}
      disabled={unreachableOptions && unreachableOptions.includes(option)}
    />
  ))

  if (accordion) {
    return (
      <Accordion disableGutters sx={{ backgroundColor: 'transparent' }}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
          <Stack
            direction='row'
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <Typography component='h2' variant='h6'>
              {`${label}`}
            </Typography>
            <Typography variant='caption'>{subheading ? subheading : ''}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <>
            {!expanded && allOptions.slice(0, expandThreshold)}
            {allOptions.length === 0 && (
              <Typography color='text.secondary' textAlign={'center'}>
                No items available
              </Typography>
            )}
            {expanded && allOptions}
            {options.length > expandThreshold && (
              <Button onClick={toggleExpansion}>{expanded ? 'Show less' : 'Show more...'}</Button>
            )}
          </>
        </AccordionDetails>
      </Accordion>
    )
  }

  return (
    <>
      {label && (
        <Typography component='h2' variant='h6' alignContent='center' sx={{ height: '56px' }}>{`${label}`}</Typography>
      )}
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
  variant?: 'filled' | 'outlined'
  icon?: ReactElement
  style?: CSSProperties
  disabled?: boolean
}

function ChipItem({
  chip,
  handleChange,
  size,
  activeChip,
  chipTooltipTitle = '',
  ariaLabel = '',
  variant = 'filled',
  icon = <></>,
  style = {},
  disabled = false,
}: ChipItemProps) {
  return (
    <Tooltip title={chipTooltipTitle}>
      <span>
        <Chip
          color={activeChip ? 'secondary' : 'default'}
          size={size}
          key={chip}
          sx={{ mx: 0.5, mb: 1, ...style }}
          label={chip}
          data-test={`chipOption-${chip}`}
          onClick={() => handleChange(chip)}
          aria-label={ariaLabel}
          variant={variant}
          icon={icon}
          disabled={disabled}
        />
      </span>
    </Tooltip>
  )
}
