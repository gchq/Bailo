import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { ReactElement, useEffect, useState } from 'react'

type PartialTagSelectorProps =
  | {
      multiple: true
      onChange: (value: string[]) => void
    }
  | {
      multiple?: false
      onChange: (value: string) => void
    }

type TagSelectorProps = {
  label: string
  tags: string[]
  size?: 'small' | 'medium'
  expandThreshold?: number
} & PartialTagSelectorProps

export default function ChipSelector({
  label,
  tags,
  onChange,
  multiple,
  size = 'medium',
  expandThreshold = 5,
}: TagSelectorProps): ReactElement {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (multiple) {
      onChange(selectedTags)
    } else {
      onChange(selectedTags[0])
    }
  }, [selectedTags, multiple, onChange])

  const handleChange = (selectedTag: string): void => {
    if (multiple) {
      if (selectedTags.includes(selectedTag)) {
        setSelectedTags(selectedTags.filter((tag) => tag !== selectedTag))
      } else {
        setSelectedTags([...selectedTags, selectedTag])
      }
    } else {
      setSelectedTags(selectedTags[0] !== selectedTag ? [selectedTag] : [])
    }
  }

  function toggleExpansion(): void {
    setExpanded(!expanded)
  }

  const allTags = tags.map((tag) => (
    <Tag key={tag} tag={tag} size={size} activeChip={selectedTags.includes(tag)} handleChange={handleChange} />
  ))

  function displaySelectedTagCount(): string {
    return multiple && selectedTags.length > 0 ? `(${selectedTags.length} selected)` : ''
  }

  return (
    <>
      <Typography variant='h6'>{`${label} ${displaySelectedTagCount()}`}</Typography>
      {!expanded && allTags.slice(0, expandThreshold)}
      {expanded && allTags}
      {tags.length > expandThreshold && (
        <Button onClick={toggleExpansion}>{expanded ? 'Show less' : 'Show more...'}</Button>
      )}
    </>
  )
}

type TagProps = {
  tag: string
  handleChange: (value: string) => void
  size?: TagSelectorProps['size']
  activeChip: boolean
}

function Tag({ tag, handleChange, size, activeChip }: TagProps) {
  return (
    <Chip
      color={activeChip ? 'primary' : 'default'}
      size={size}
      key={tag}
      sx={{ mr: 1, mb: 1 }}
      label={tag}
      onClick={() => handleChange(tag)}
    />
  )
}
