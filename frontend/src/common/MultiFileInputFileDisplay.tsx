import { Chip, Grid, TextField, Tooltip, Typography } from '@mui/material'
import { useGetModelFiles } from 'actions/entry'
import { patchFile } from 'actions/file'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useState } from 'react'
import EntryTagSelector from 'src/common/TagSelector'
import { FileInterface, FileUploadMetadata, FileWithMetadataAndTags, isFileInterface } from 'types/types'

interface MultiFileInputDisplayProps {
  file: File | FileInterface
  onDelete: (file: File | FileInterface) => void
  onMetadataChange: (fileWithMetadata: FileWithMetadataAndTags) => void
  readOnly?: boolean
}

export default function MultiFileInputFileDisplay({
  file,
  onDelete,
  onMetadataChange,
  readOnly = false,
}: MultiFileInputDisplayProps) {
  const [metadata, setMetadata] = useState<FileUploadMetadata>({ text: '', tags: [] })
  const [fileTagErrorMessage, setFileTagErrorMessage] = useState('')
  const [newFileTags, setNewFileTags] = useState<string[]>([])

  const { mutateModelFiles } = useGetModelFiles(isFileInterface(file) ? file.modelId : '')

  const handleDelete = () => {
    onDelete(file)
  }

  const handleMetadataChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMetadata({ ...metadata, text: event.target.value })
    onMetadataChange({ fileName: file.name, metadata })
  }

  const handleFileTagSelectorOnChange = async (newTags: string[]) => {
    setFileTagErrorMessage('')
    if (newTags.includes('')) {
      setFileTagErrorMessage('Tags must have at least one character')
      return
    }
    if (isFileInterface(file)) {
      const res = await patchFile(file.modelId, file._id, { tags: newTags.filter((newTag) => newTag !== '') })
      mutateModelFiles()

      if (res.status && res.status >= 200 && res.status < 300) {
        mutateModelFiles()
        return
      }
      if (typeof res.data === 'string' && res.data.length > 0) {
        setFileTagErrorMessage(res.data)
      } else {
        setFileTagErrorMessage('Failed to update file tags. Please try again.')
      }
    } else {
      setNewFileTags(newTags)
      onMetadataChange({
        fileName: file.name,
        metadata: {
          text: '',
          tags: newTags.filter((newTag) => newTag !== ''),
        },
      })
    }
  }

  return (
    <Grid container spacing={1} alignItems='center' sx={{ width: '100%' }}>
      <Grid size={{ xs: 4 }}>
        <Tooltip title={file.name}>
          <Chip color='primary' label={file.name} onDelete={readOnly ? undefined : handleDelete} />
        </Tooltip>
      </Grid>
      <Grid size={{ xs: 7 }}>
        <EntryTagSelector
          onChange={handleFileTagSelectorOnChange}
          tags={isFileInterface(file) ? file.tags : newFileTags}
          errorText={fileTagErrorMessage}
          restrictedToAction='editEntry'
        />
        <TextField
          size='small'
          placeholder='Optional metadata'
          sx={{ width: '100%', display: 'none' }}
          value={metadata}
          onChange={handleMetadataChange}
        />
      </Grid>
      <Grid size={{ xs: 1 }} textAlign='right'>
        <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
      </Grid>
    </Grid>
  )
}
