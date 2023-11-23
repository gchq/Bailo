import { Chip, Stack, TextField } from '@mui/material'
import { ChangeEvent, useCallback, useState } from 'react'
import { FileWithMetadata } from 'types/interfaces'

interface MultiFileInputDisplayProps {
  file: File
  handleDelete: (file: File) => void
  onChange: (fileWithMetadata: FileWithMetadata) => void
}

export default function MultiFileInputFileDisplay({ file, handleDelete, onChange }: MultiFileInputDisplayProps) {
  const [metadata, setMetadata] = useState('')

  const handleMetadataChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMetadata(event.target.value)
      onChange({ fileName: file.name, metadata })
    },
    [onChange, file.name, metadata],
  )

  return (
    <Stack direction='row' alignItems='center' spacing={1}>
      <Chip color='primary' label={file.name} onDelete={() => handleDelete(file)} />
      <TextField
        size='small'
        placeholder='Optional metadata'
        sx={{ width: '100%', display: 'none' }}
        value={metadata}
        onChange={handleMetadataChange}
      />
    </Stack>
  )
}
