import { Chip, Grid, TextField, Tooltip } from '@mui/material'
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
    <Grid container spacing={1} alignItems='center'>
      <Grid item xs={4}>
        <Tooltip title={file.name}>
          <Chip
            color='primary'
            label={file.name}
            onDelete={() => handleDelete(file)}
            sx={{ width: '100%', justifyContent: 'space-between' }}
          />
        </Tooltip>
      </Grid>
      <Grid item xs={8}>
        <TextField
          size='small'
          placeholder='Optional metadata'
          sx={{ width: '100%', display: 'none' }}
          value={metadata}
          onChange={handleMetadataChange}
        />
      </Grid>
    </Grid>
  )
}
