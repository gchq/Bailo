import { Popover, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TagSelector from 'src/MuiForms/TagSelector'

interface FileTagSelectorProps {
  anchorEl: HTMLButtonElement | null
  setAnchorEl: (anchorEl: HTMLButtonElement | null) => void
  onChange: (newTag: string[]) => void
  tags: string[]
  errorText?: string
}

export default function FileTagSelector({
  anchorEl,
  setAnchorEl,
  onChange,
  tags,
  errorText = '',
}: FileTagSelectorProps) {
  const theme = useTheme()

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
      <Stack sx={{ p: 2 }}>
        <TagSelector value={tags} onChange={onChange} label={''} formContext={{ editMode: true }} />
        <Typography variant='caption' color={theme.palette.error.main}>
          {errorText}
        </Typography>
      </Stack>
    </Popover>
  )
}
