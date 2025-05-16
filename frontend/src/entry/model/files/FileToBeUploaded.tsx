import { Stack, TextField, Typography } from '@mui/material'
import { ChangeEvent } from 'react'
import { FileUploadWithMetadata } from 'types/types'

interface FileToBeUploadedProps {
  fileWithMetadata: FileUploadWithMetadata
  showMetaDataInput?: boolean
  onFileMetadataChange: (metadata: string, fileName: string) => void
}

export default function FileToBeUploaded({
  fileWithMetadata,
  showMetaDataInput = false,
  onFileMetadataChange,
}: FileToBeUploadedProps) {
  const handleMetadataOnChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onFileMetadataChange(event.target.value, fileWithMetadata.file.name)
  }

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <Typography key={fileWithMetadata.file.name}>{fileWithMetadata.file.name}</Typography>
      {showMetaDataInput && (
        <TextField size='small' value={fileWithMetadata.metadata?.text} onChange={handleMetadataOnChange} />
      )}
    </Stack>
  )
}
