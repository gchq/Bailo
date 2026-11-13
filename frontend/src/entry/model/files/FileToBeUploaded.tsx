import Delete from '@mui/icons-material/Delete'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import { Box, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { type ChangeEvent, useCallback } from 'react'
import TagSelector from 'src/common/TagSelector'
import { type FileUploadMetadata, type FileUploadWithMetadata } from 'types/types'

interface FileToBeUploadedProps {
  fileWithMetadata: FileUploadWithMetadata
  showMetaDataInput?: boolean
  onFileMetadataChange: (metadata: FileUploadMetadata, relativePath: string) => void
  onDelete: (relativePath: string) => void
}

export default function FileToBeUploaded({
  fileWithMetadata,
  showMetaDataInput = false,
  onFileMetadataChange,
  onDelete,
}: FileToBeUploadedProps) {
  const displayName = fileWithMetadata.uploadPath || fileWithMetadata.file.name

  const handleMetadataTextOnChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onFileMetadataChange(
        {
          text: event.target.value,
          tags: fileWithMetadata.metadata ? fileWithMetadata.metadata.tags.filter((newTag) => newTag !== '') : [],
        },
        fileWithMetadata.relativePath,
      )
    },
    [onFileMetadataChange, fileWithMetadata.relativePath, fileWithMetadata.metadata],
  )

  const handleFileTagSelectorOnChange = useCallback(
    (newTags: string[]) => {
      onFileMetadataChange(
        {
          text: fileWithMetadata.metadata ? fileWithMetadata.metadata.text : '',
          tags: newTags.filter((newTag) => newTag !== ''),
        },
        fileWithMetadata.relativePath,
      )
    },
    [fileWithMetadata.relativePath, fileWithMetadata.metadata, onFileMetadataChange],
  )

  return (
    <Box
      sx={{
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction='row'
          spacing={1}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack
            direction='row'
            spacing={1}
            sx={{
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <InsertDriveFileOutlined color='primary' fontSize='small' />
            <Tooltip title={displayName}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {displayName}
              </Typography>
            </Tooltip>
            <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
              {prettyBytes(fileWithMetadata.file.size)}
            </Typography>
          </Stack>
          <IconButton
            size='small'
            aria-label={`remove ${displayName} from files to upload`}
            onClick={() => onDelete(fileWithMetadata.relativePath)}
          >
            <Delete fontSize='small' />
          </IconButton>
        </Stack>
        {showMetaDataInput && (
          <TextField
            size='small'
            label='Metadata'
            placeholder='Enter metadata details...'
            fullWidth
            value={fileWithMetadata.metadata?.text}
            onChange={handleMetadataTextOnChange}
          />
        )}
        <TagSelector
          restrictedToAction='editEntry'
          onChange={handleFileTagSelectorOnChange}
          tags={fileWithMetadata.metadata ? fileWithMetadata.metadata?.tags : []}
        />
      </Stack>
    </Box>
  )
}
