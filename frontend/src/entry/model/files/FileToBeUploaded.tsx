import { Chip, Grid, TextField, Tooltip, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useCallback } from 'react'
import TagSelector from 'src/common/TagSelector'
import { FileUploadMetadata, FileUploadWithMetadata } from 'types/types'

interface FileToBeUploadedProps {
  fileWithMetadata: FileUploadWithMetadata
  showMetaDataInput?: boolean
  onFileMetadataChange: (metadata: FileUploadMetadata, fileName: string) => void
  onDelete: (fileName: string) => void
}

export default function FileToBeUploaded({
  fileWithMetadata,
  showMetaDataInput = false,
  onFileMetadataChange,
  onDelete,
}: FileToBeUploadedProps) {
  const handleMetadataTextOnChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onFileMetadataChange(
        {
          text: event.target.value,
          tags: fileWithMetadata.metadata ? fileWithMetadata.metadata.tags.filter((newTag) => newTag !== '') : [],
        },
        fileWithMetadata.file.name,
      )
    },
    [onFileMetadataChange, fileWithMetadata.file.name, fileWithMetadata.metadata],
  )

  const handleFileTagSelectorOnChange = useCallback(
    (newTags: string[]) => {
      onFileMetadataChange(
        {
          text: fileWithMetadata.metadata ? fileWithMetadata.metadata.text : '',
          tags: newTags.filter((newTag) => newTag !== ''),
        },
        fileWithMetadata.file.name,
      )
    },
    [fileWithMetadata.file.name, fileWithMetadata.metadata, onFileMetadataChange],
  )

  return (
    <Grid container spacing={1} alignItems='center'>
      <Grid size={{ xs: 9 }} textOverflow='ellipsis'>
        <Tooltip title={fileWithMetadata.file.name}>
          <Chip
            color='primary'
            label={fileWithMetadata.file.name}
            onDelete={() => onDelete(fileWithMetadata.file.name)}
          />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 2 }}>
        <TagSelector
          restrictedToAction='editEntry'
          onChange={handleFileTagSelectorOnChange}
          tags={fileWithMetadata.metadata ? fileWithMetadata.metadata?.tags : []}
        />
        {showMetaDataInput && (
          <TextField size='small' value={fileWithMetadata.metadata?.text} onChange={handleMetadataTextOnChange} />
        )}
      </Grid>
      <Grid size={{ xs: 1 }} textAlign='right'>
        <Typography variant='caption'>{prettyBytes(fileWithMetadata.file.size)}</Typography>
      </Grid>
    </Grid>
  )
}
