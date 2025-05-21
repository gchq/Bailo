import { Clear, LocalOffer } from '@mui/icons-material'
import { Button, IconButton, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ChangeEvent, useCallback, useState } from 'react'
import FileTagSelector from 'src/entry/model/releases/FileTagSelector'
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
  const [anchorElFileTag, setAnchorElFileTag] = useState<HTMLButtonElement | null>(null)

  const theme = useTheme()

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
    <Stack>
      <Stack direction='row' spacing={2} alignItems='center'>
        <IconButton sx={{ color: theme.palette.error.main }} onClick={() => onDelete(fileWithMetadata.file.name)}>
          <Clear fontSize='inherit' />
        </IconButton>
        <Typography key={fileWithMetadata.file.name}>{fileWithMetadata.file.name}</Typography>
        {showMetaDataInput && (
          <TextField size='small' value={fileWithMetadata.metadata?.text} onChange={handleMetadataTextOnChange} />
        )}
      </Stack>
      <Button
        sx={{ width: 'fit-content' }}
        size='small'
        startIcon={<LocalOffer />}
        onClick={(event) => setAnchorElFileTag(event.currentTarget)}
      >
        Apply file tags
      </Button>
      <FileTagSelector
        anchorEl={anchorElFileTag}
        setAnchorEl={setAnchorElFileTag}
        onChange={handleFileTagSelectorOnChange}
        tags={fileWithMetadata.metadata ? fileWithMetadata.metadata?.tags : []}
        errorText={''}
      />
    </Stack>
  )
}
