import { Chip, Grid, TextField, Tooltip, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useState } from 'react'
import { FileWithMetadata } from 'types/interfaces'
import { FileInterface } from 'types/types'

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
    <Grid container spacing={1} alignItems='center'>
      <Grid item xs>
        <Tooltip title={file.name}>
          <Chip color='primary' label={file.name} onDelete={readOnly ? undefined : handleDelete} />
        </Tooltip>
      </Grid>
      <Grid item xs={7}>
        <TextField
          size='small'
          placeholder='Optional metadata'
          sx={{ width: '100%', display: 'none' }}
          value={metadata}
          onChange={handleMetadataChange}
        />
      </Grid>
      <Grid item xs={1} textAlign='right'>
        <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
      </Grid>
    </Grid>
  )
}
