import { Chip, Grid2, TextField, Tooltip, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useState } from 'react'
import { FileInterface, FileWithMetadata } from 'types/types'

interface MultiFileInputDisplayProps {
  file: File | FileInterface
  onDelete: (file: File | FileInterface) => void
  onMetadataChange: (fileWithMetadata: FileWithMetadata) => void
  readOnly?: boolean
}

export default function MultiFileInputFileDisplay({
  file,
  onDelete,
  onMetadataChange,
  readOnly = false,
}: MultiFileInputDisplayProps) {
  const [metadata, setMetadata] = useState('')

  const handleDelete = () => {
    onDelete(file)
  }

  const handleMetadataChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMetadata(event.target.value)
    onMetadataChange({ fileName: file.name, metadata })
  }

  return (
    <Grid2 container spacing={1} alignItems='center'>
      <Grid2 size='auto'>
        <Tooltip title={file.name}>
          <Chip color='primary' label={file.name} onDelete={readOnly ? undefined : handleDelete} />
        </Tooltip>
      </Grid2>
      <Grid2 size={{ xs: 7 }}>
        <TextField
          size='small'
          placeholder='Optional metadata'
          sx={{ width: '100%', display: 'none' }}
          value={metadata}
          onChange={handleMetadataChange}
        />
      </Grid2>
      <Grid2 size={{ xs: 1 }} textAlign='right'>
        <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
      </Grid2>
    </Grid2>
  )
}
