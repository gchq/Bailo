import { Box, Popover } from '@mui/material'
import TagSelector from 'src/MuiForms/TagSelector'

interface FileTagSelectorProps {
  anchorEl: HTMLButtonElement | null
  setAnchorEl: (anchorEl: HTMLButtonElement | null) => void
  onChange: (newTag: string[]) => void
  tags: string[]
}

export default function FileTagSelector({ anchorEl, setAnchorEl, onChange, tags }: FileTagSelectorProps) {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2 }}>
        <TagSelector value={tags} onChange={onChange} label={''} formContext={{ editMode: true }} />{' '}
      </Box>
    </Popover>
  )
}
