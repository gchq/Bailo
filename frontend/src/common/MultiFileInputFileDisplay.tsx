import { Box, Chip, Stack, TextField } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ChangeEvent, useCallback, useState } from 'react'
import { FileWithMetadata } from 'types/interfaces'

const displayFilename = (filename: string) => {
  const parts = filename.split('.')
  const ext = parts.pop()
  const base = parts.join('.')
  return base.length > 12 ? `${base}...${ext}` : filename
}

interface MultiFileInputDisplayProps {
  file: File
  handleDelete: (file: File) => void
  onChange: (fileWithMetadata: FileWithMetadata) => void
}

export default function MultiFileInputFileDisplay({ file, handleDelete, onChange }: MultiFileInputDisplayProps) {
  const theme = useTheme()
  const [metadata, setMetadata] = useState('')

  const handleMetadataChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMetadata(event.target.value)
      onChange({ fileName: file.name, metadata })
    },
    [onChange, file.name, metadata],
  )

  return (
    <Box sx={{ border: 'solid', borderWidth: '0.5px', borderColor: theme.palette.primary.main }}>
      <Stack direction='row' alignItems='center' spacing={1} sx={{ m: 1 }}>
        <Chip color='primary' label={displayFilename(file.name)} onDelete={() => handleDelete(file)} />
        <TextField
          size='small'
          placeholder='Optional metadata'
          sx={{ width: '100%', display: 'none' }}
          value={metadata}
          onChange={handleMetadataChange}
        />
      </Stack>
    </Box>
  )
}
