import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { ReactElement, useState } from 'react'

type PartialTagSelectorProps<T> =
  | {
      multiple: true
      tags: T[]
      selectedTags: T[]
      onChange: (value: T[]) => void
    }
  | {
      multiple?: false
      tags: (T | '')[]
      selectedTags: T | ''
      onChange: (value: T | '') => void
    }

type TagSelectorProps<T> = {
  label: string
  size?: 'small' | 'medium'
  expandThreshold?: number
} & PartialTagSelectorProps<T>

export default function ChipSelector<T extends string = string>({
  label,
  tags,
  onChange,
  selectedTags,
  multiple,
  size = 'medium',
  expandThreshold = 5,
}: TagSelectorProps<T>): ReactElement {
  const [expanded, setExpanded] = useState(false)

  const handleChange = (selectedTag: T): void => {
    if (multiple) {
      if (selectedTags.includes(selectedTag)) {
        onChange(selectedTags.filter((tag) => tag !== selectedTag))
      } else {
        onChange([...selectedTags, selectedTag])
      }
    } else {
      onChange(selectedTags !== selectedTag ? selectedTag : '')
    }
  }

  function toggleExpansion(): void {
    setExpanded(!expanded)
  }

  const allTags = tags.map((tag) => (
    <Tag<T> key={tag} tag={tag} size={size} activeChip={selectedTags.includes(tag)} handleChange={handleChange} />
  ))

  function displaySelectedTagCount(): string {
    return multiple && selectedTags.length > 0 ? `(${selectedTags.length} selected)` : ''
  }

  return (
    <>
      <Typography component='h2' variant='h6'>{`${label} ${displaySelectedTagCount()}`}</Typography>
      {!expanded && allTags.slice(0, expandThreshold)}
      {expanded && allTags}
      {tags.length > expandThreshold && (
        <Button onClick={toggleExpansion}>{expanded ? 'Show less' : 'Show more...'}</Button>
      )}
    </>
  )
}

type TagProps<T> = {
  tag: T
  handleChange: (value: T) => void
  size?: TagSelectorProps<T>['size']
  activeChip: boolean
}

function Tag<T extends string = string>({ tag, handleChange, size, activeChip }: TagProps<T>) {
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
