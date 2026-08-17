import Delete from '@mui/icons-material/Delete'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import { Box, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
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
            <Tooltip title={fileWithMetadata.file.name}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {fileWithMetadata.file.name}
              </Typography>
            </Tooltip>
            <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
              {prettyBytes(fileWithMetadata.file.size)}
            </Typography>
          </Stack>
          <IconButton
            size='small'
            aria-label={`remove ${fileWithMetadata.file.name} from files to upload`}
            onClick={() => onDelete(fileWithMetadata.file.name)}
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
