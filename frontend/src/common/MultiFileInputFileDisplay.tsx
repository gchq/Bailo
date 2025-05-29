import { LocalOffer } from '@mui/icons-material'
import { Button, Chip, Grid2, TextField, Tooltip, Typography } from '@mui/material'
import { patchFile } from 'actions/file'
import { useGetModelFiles } from 'actions/model'
import prettyBytes from 'pretty-bytes'
import { ChangeEvent, useState } from 'react'
import Restricted from 'src/common/Restricted'
import FileTagSelector from 'src/entry/model/releases/FileTagSelector'
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
  const [anchorElFileTag, setAnchorElFileTag] = useState<HTMLButtonElement | null>(null)
  const [fileTagErrorMessage, setFileTagErrorMessage] = useState('')
  const [newFileTags, setNewFileTags] = useState<string[]>([])
  const [fileTagCount, setFileTagCount] = useState(isFileInterface(file) ? file.tags.length : newFileTags.length)

  const { mutateEntryFiles } = useGetModelFiles(isFileInterface(file) ? file.modelId : '')

  const handleDelete = () => {
    onDelete(file)
  }

  const handleMetadataChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMetadata({ ...metadata, text: event.target.value })
    onMetadataChange({ fileName: file.name, metadata })
  }

  const handleFileTagSelectorOnChange = async (newTags: string[]) => {
    setFileTagCount(newTags.length)
    if (isFileInterface(file)) {
      setFileTagErrorMessage('')
      const res = await patchFile(file.modelId, file._id, { tags: newTags.filter((newTag) => newTag !== '') })
      mutateEntryFiles()
      if (res.status !== 200) {
        setFileTagErrorMessage('You lack the required authorisation in order to add tags to a file.')
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
    <Grid2 container spacing={1} alignItems='center' sx={{ width: '100%' }}>
      <Grid2 size={{ xs: 4 }}>
        <Tooltip title={file.name}>
          <Chip color='primary' label={file.name} onDelete={readOnly ? undefined : handleDelete} />
        </Tooltip>
      </Grid2>
      <Grid2 size={{ xs: 7 }}>
        <Restricted action='editEntry' fallback={<></>}>
          <Button
            sx={{ width: 'fit-content' }}
            size='small'
            startIcon={<LocalOffer />}
            onClick={(event) => setAnchorElFileTag(event.currentTarget)}
          >
            {`Edit file tags ${fileTagCount > 0 ? `(${fileTagCount})` : ''}`}
          </Button>
        </Restricted>
        <FileTagSelector
          anchorEl={anchorElFileTag}
          setAnchorEl={setAnchorElFileTag}
          onChange={handleFileTagSelectorOnChange}
          tags={isFileInterface(file) ? file.tags : newFileTags}
          errorText={fileTagErrorMessage}
        />
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
